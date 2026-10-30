/** @jest-environment node */
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({ queryRows: jest.fn() }));
jest.mock("@/lib/analytics-archive/authorization", () => ({
  requireAnalyticsOwner: jest.fn(),
}));
import { queryRows } from "@/lib/db";
import { requireAnalyticsOwner } from "@/lib/analytics-archive/authorization";
import {
  analyticsReportRange,
  getOwnerAnalyticsReport,
  type ReportParams,
} from "@/lib/analytics-archive/report";
const now = new Date("2026-10-10T09:17:00Z");
const range = { from: "2026-10-01", through: "2026-10-03" };
const snapshot = {
  total: "9007199254740993",
  verified: 1,
  expected: 3,
  unavailable: 1,
  incomplete: 0,
  failures: 0,
  missing: 1,
  updated: "2026-10-04T09:17:00Z",
  pathCount: 51,
  trend: [
    {
      day: "2026-10-01",
      status: "complete",
      views: "9007199254740993",
      visitors: "2",
    },
    { day: "2026-10-02", status: "unavailable", views: null, visitors: null },
    { day: "2026-10-03", status: "missing", views: null, visitors: null },
  ],
  pages: [{ path: "/mark2/admin/private", views: "9007199254740992" }],
};
beforeEach(() => {
  jest.clearAllMocks();
  process.env.ANALYTICS_PROJECT_ID = "fixture-project";
  delete process.env.NEXT_PHASE;
  jest.mocked(requireAnalyticsOwner).mockResolvedValue(undefined);
  jest.mocked(queryRows).mockResolvedValue([{ snapshot }]);
});
test("default period is the preceding 30 completed UTC days", () => {
  expect(analyticsReportRange({}, now)).toEqual({
    from: "2026-09-10",
    through: "2026-10-09",
  });
});
test.each<ReportParams>([
  { from: "2026-02-30", through: "2026-03-01" },
  { from: "2026-10-02", through: "2026-10-01" },
  { from: "2025-01-01", through: "2026-10-09" },
  { from: "2026-10-10", through: "2026-10-10" },
  { from: ["2026-10-01", "2026-10-02"] },
  { through: [] },
  { from: "" },
  { from: "0001-01-01", through: "0100-01-01" },
  { from: "2026-10-01'; DROP TABLE dojo.analytics_day;--" },
])(
  "invalid/ambiguous range %j fails before any report query",
  async (params) => {
    const result = await getOwnerAnalyticsReport(params, now);
    expect(result.error).toContain("366 completed days");
    expect(queryRows).not.toHaveBeenCalled();
  },
);
test("366 inclusive days and leap-day boundaries are valid", () => {
  expect(
    analyticsReportRange({ from: "2025-10-09", through: "2026-10-09" }, now),
  ).toEqual({ from: "2025-10-09", through: "2026-10-09" });
  expect(
    analyticsReportRange({ from: "2024-02-28", through: "2024-03-01" }, now),
  ).toEqual({ from: "2024-02-28", through: "2024-03-01" });
});
test("helper rechecks owner authorization before reading or reporting private data", async () => {
  jest
    .mocked(requireAnalyticsOwner)
    .mockRejectedValueOnce(new Error("Forbidden"));
  await expect(getOwnerAnalyticsReport(range, now)).rejects.toThrow(
    "Forbidden",
  );
  expect(queryRows).not.toHaveBeenCalled();
});
test("private report binds project/dates, uses sitewide totals and numerically bounded rankings", async () => {
  const fetcher = jest.spyOn(globalThis, "fetch");
  try {
    expect((await getOwnerAnalyticsReport(range, now)).snapshot).toEqual(
      snapshot,
    );
    const [sql, params] = jest.mocked(queryRows).mock.calls[0];
    expect(params).toEqual(["fixture-project", range.from, range.through]);
    expect(sql).toContain("coalesce(sum(pageviews),0)::text FROM verified");
    expect(sql).toContain("status IN ('complete','zero')");
    expect(sql).toContain("ORDER BY ranked.views DESC,path LIMIT 50");
    expect(sql).toContain("p.views::numeric DESC,p.path");
    expect(sql).not.toMatch(/public_views|ANY\(|INSERT|UPDATE|DELETE/);
    expect(sql).not.toContain(range.from);
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    fetcher.mockRestore();
  }
});
test("reports are not reused across private requests or projects", async () => {
  await getOwnerAnalyticsReport(range, now);
  process.env.ANALYTICS_PROJECT_ID = "second-owner-project";
  await getOwnerAnalyticsReport(range, now);
  expect(requireAnalyticsOwner).toHaveBeenCalledTimes(2);
  expect(queryRows).toHaveBeenCalledTimes(2);
  expect(jest.mocked(queryRows).mock.calls[1][1]?.[0]).toBe(
    "second-owner-project",
  );
});
test("missing project and production builds perform no report query", async () => {
  delete process.env.ANALYTICS_PROJECT_ID;
  expect((await getOwnerAnalyticsReport(range, now)).error).toContain(
    "ANALYTICS_PROJECT_ID",
  );
  process.env.NEXT_PHASE = "phase-production-build";
  jest.mocked(requireAnalyticsOwner).mockClear();
  expect((await getOwnerAnalyticsReport(range, now)).error).toContain("builds");
  expect(requireAnalyticsOwner).not.toHaveBeenCalled();
  expect(queryRows).not.toHaveBeenCalled();
});
test.each([
  null,
  { ...snapshot, total: 3 },
  {
    ...snapshot,
    trend: [{ day: "2026-10-01", status: "zero", views: "-1", visitors: "0" }],
  },
])("malformed snapshots fail closed", async (invalid) => {
  jest.mocked(queryRows).mockResolvedValueOnce([{ snapshot: invalid }]);
  const result = await getOwnerAnalyticsReport(range, now);
  expect(result.snapshot).toBeNull();
  expect(result.error).toContain("unavailable");
});
test("database error details never enter the returned report", async () => {
  jest
    .mocked(queryRows)
    .mockRejectedValueOnce(new Error("secret-token driver error"));
  const result = await getOwnerAnalyticsReport(range, now);
  expect(result.error).toContain("unavailable");
  expect(JSON.stringify(result)).not.toContain("secret-token");
});
