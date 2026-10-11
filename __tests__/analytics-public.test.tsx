import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  allPosts: [
    {
      _id: "chronicles/public.mdx",
      url: "/shaolin/public",
      title: "Public story",
      draft: false,
    },
    {
      _id: "chronicles/private.mdx",
      url: "/shaolin/private",
      title: "Restricted title",
      draft: true,
    },
  ],
}));
jest.mock("next/cache", () => ({ unstable_cache: jest.fn((fn) => fn) }));
jest.mock("@/lib/db", () => ({ queryRows: jest.fn() }));
jest.mock("@/lib/env", () => ({ isNextBuild: jest.fn(() => false) }));
jest.mock("@/components/layout/DataPageShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/analytics/TrafficChart", () => ({
  TrafficChart: () => <div>Daily chart</div>,
}));
import {
  getPublicAnalytics,
  readPublicAnalytics,
  publicAnalyticsPages,
  formatViews,
} from "@/lib/analytics-archive/public";
import { queryRows } from "@/lib/db";
import { isNextBuild } from "@/lib/env";
import { PageViewCounter } from "@/components/analytics/PageViewCounter";
import TrafficStatisticsPage from "@/app/stats/page";
const snapshot = {
  total: "7",
  from: "2026-10-01",
  through: "2026-10-03",
  verified: "2",
  expected: "3",
  updated: "2026-10-04T09:17:00Z",
  trend: [
    { day: "2026-10-01", views: "7" },
    { day: "2026-10-02", views: null },
    { day: "2026-10-03", views: "0" },
  ],
  pages: [{ path: "/shaolin/public", views: "7" }],
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.ANALYTICS_PROJECT_ID = "fixture-project";
  jest.mocked(isNextBuild).mockReturnValue(false);
  jest
    .mocked(queryRows)
    .mockResolvedValue([{ snapshot: JSON.parse(JSON.stringify(snapshot)) }]);
});
afterEach(() => {
  delete process.env.ANALYTICS_PROJECT_ID;
});
test("public registry uses existing source identity and excludes drafts and operational paths", () => {
  expect(publicAnalyticsPages()).toContainEqual({
    id: "chronicles/public.mdx",
    path: "/shaolin/public",
    title: "Public story",
  });
  expect(
    publicAnalyticsPages().some(
      (p) => p.title === "Restricted title" || p.path.startsWith("/mark2"),
    ),
  ).toBe(false);
});
test("read query filters project, exact public paths, verified days and completed UTC days; no stage/API reads", async () => {
  await readPublicAnalytics("fixture-project", ["/shaolin/public"]);
  const [sql, values] = jest.mocked(queryRows).mock.calls[0];
  expect(values).toEqual(["fixture-project", ["/shaolin/public"]]);
  expect(sql).toContain("p.request_path=ANY($2::text[])");
  expect(sql).toContain("status IN ('complete','zero')");
  expect(sql).toContain("AT TIME ZONE 'UTC'");
  expect(sql).toContain("WHEN v.day IS NULL THEN NULL");
  expect(sql).not.toContain("analytics_stage");
});
test("build and missing configuration do no DB work", async () => {
  jest.mocked(isNextBuild).mockReturnValue(true);
  expect((await getPublicAnalytics()).snapshot).toBeNull();
  jest.mocked(isNextBuild).mockReturnValue(false);
  delete process.env.ANALYTICS_PROJECT_ID;
  expect((await getPublicAnalytics()).snapshot).toBeNull();
  expect(queryRows).not.toHaveBeenCalled();
});
test("database errors and malformed snapshots fail closed without disclosing details", async () => {
  jest
    .mocked(queryRows)
    .mockRejectedValueOnce(new Error("private database credential"));
  render(await PageViewCounter({ path: "/shaolin/public" }));
  expect(screen.getByText("Page views unavailable.")).toBeVisible();
  expect(screen.queryByText(/credential/)).not.toBeInTheDocument();
  jest
    .mocked(queryRows)
    .mockResolvedValueOnce([{ snapshot: { ...snapshot, total: "-1" } }]);
  expect((await getPublicAnalytics()).snapshot).toBeNull();
});
test("counter distinguishes verified zero from unavailable and hides unsupported paths", async () => {
  expect(await PageViewCounter({ path: "/mark2/admin" })).toBeNull();
  render(await PageViewCounter({ path: "/shaolin" }));
  expect(screen.getByText(/0 archived views/)).toBeVisible();
  expect(screen.getByText(/coverage incomplete/)).toBeVisible();
});
test("public stats show gaps, zero, coverage and safe source titles", async () => {
  jest.mocked(queryRows).mockResolvedValueOnce([
    {
      snapshot: {
        ...snapshot,
        pages: [
          ...snapshot.pages,
          { path: "/mark2/admin/secret", views: "99" },
          { path: "/shaolin/private", views: "99" },
        ],
      },
    },
  ]);
  render(await TrafficStatisticsPage());
  expect(screen.getByText("7 total archived public views")).toBeVisible();
  expect(screen.getByText(/Coverage is incomplete/)).toBeVisible();
  fireEvent.click(screen.getByText("Daily values"));
  expect(screen.getByText("Unverified")).toBeVisible();
  expect(screen.getByRole("link", { name: "Public story" })).toHaveAttribute(
    "href",
    "/shaolin/public",
  );
  expect(screen.queryByText(/Restricted title|secret/)).not.toBeInTheDocument();
  expect(screen.queryByText(/all-time/i)).not.toBeInTheDocument();
});
test("empty archive renders unavailable rather than fabricated zero", async () => {
  jest.mocked(queryRows).mockResolvedValueOnce([
    {
      snapshot: {
        ...snapshot,
        from: null,
        through: null,
        verified: "0",
        expected: "0",
        total: "0",
        pages: [],
        trend: [],
      },
    },
  ]);
  render(await TrafficStatisticsPage());
  expect(screen.getByRole("status")).toHaveTextContent(
    "Archived traffic is unavailable",
  );
  expect(screen.queryByText(/total archived/)).not.toBeInTheDocument();
});
test("view totals retain bigint precision", () => {
  expect(formatViews("9007199254740993")).toBe("9,007,199,254,740,993");
});
