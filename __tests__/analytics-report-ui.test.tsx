import { render, screen } from "@testing-library/react";
import AnalyticsReport from "@/app/mark2/admin/analytics/Report";
import type { OwnerAnalyticsReport } from "@/lib/analytics-archive/report";
jest.mock("@/components/analytics/TrafficChart", () => ({
  TrafficChart: ({ scope }: { scope: string }) => (
    <div role="img" aria-label={scope + " traffic trend"} />
  ),
}));
const report: OwnerAnalyticsReport = {
  range: { from: "2026-10-01", through: "2026-10-03" },
  maxDay: "2026-10-09",
  error: null,
  snapshot: {
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
        visitors: "5",
      },
      { day: "2026-10-02", status: "unavailable", views: null, visitors: null },
      { day: "2026-10-03", status: "missing", views: null, visitors: null },
    ],
    pages: [{ path: "/mark2/admin/<script>", views: "12" }],
  },
};
test("owner report uses read-only date selection, exact counts, gap labels and bounded private paths", () => {
  render(<AnalyticsReport report={report} />);
  expect(
    screen.getByText("9,007,199,254,740,993 archived whole-site pageviews"),
  ).toBeInTheDocument();
  expect(screen.getByText(/1 of 3 days verified; 2 gaps/)).toBeInTheDocument();
  expect(
    screen.getByText(
      /1 unavailable; 0 incomplete; 0 API-failed; 1 unattempted/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Showing 1 of 51 paths; at most 50/),
  ).toBeInTheDocument();
  expect(screen.getByText("/mark2/admin/<script>")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByRole("img")).toHaveAccessibleName(
    "sitewide traffic trend",
  );
  const from = screen.getByLabelText("From (UTC)");
  expect(from).toHaveValue("2026-10-01");
  expect(from.closest("form")).toHaveAttribute("method", "get");
  expect(screen.getByRole("button", { name: "View traffic" })).toHaveAttribute(
    "type",
    "submit",
  );
  expect(
    screen.getByText(
      /Daily visitors are not distinct visitors across a period/,
    ),
  ).toBeInTheDocument();
});
test("missing schema/configuration returns safe guidance while keeping the date form available", () => {
  render(
    <AnalyticsReport
      report={{
        ...report,
        snapshot: null,
        error: "Archived traffic is unavailable.",
      }}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Archived traffic is unavailable",
  );
  expect(screen.getByRole("button", { name: "View traffic" })).toBeEnabled();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
test("unverified empty coverage does not claim zero traffic", () => {
  render(
    <AnalyticsReport
      report={{
        ...report,
        snapshot: {
          ...report.snapshot!,
          total: "0",
          verified: 0,
          expected: 3,
          pages: [],
          pathCount: 0,
        },
      }}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "missing days are not zero traffic",
  );
  expect(
    screen.queryByText("0 archived whole-site pageviews"),
  ).not.toBeInTheDocument();
});
test("verified zero remains an exact zero count", () => {
  render(
    <AnalyticsReport
      report={{
        ...report,
        snapshot: {
          ...report.snapshot!,
          total: "0",
          verified: 3,
          expected: 3,
          pages: [],
          pathCount: 0,
        },
      }}
    />,
  );
  expect(
    screen.getByText("0 archived whole-site pageviews"),
  ).toBeInTheDocument();
});
