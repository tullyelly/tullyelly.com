import { render, screen } from "@testing-library/react";
import Overview from "@/components/categories/CategoryOverview";
import Loading from "@/app/cardattack/categories/loading";
import Page from "@/app/cardattack/categories/page";
import Detail from "@/app/cardattack/categories/[slug]/page";
import type { CategorySnapshot } from "@/lib/card-categories";
const mockList = jest.fn();
const mockGet = jest.fn();
const mockHistory = jest.fn();
const mockCan = jest.fn();
jest.mock("@/lib/data/card-categories", () => ({
  listCardCategories: () => mockList(),
  getCardCategory: () => mockGet(),
  listCategoryHistory: () => mockHistory(),
}));
jest.mock("@/lib/authz", () => ({
  canCurrentUser: (feature: string) => mockCan(feature),
}));
jest.mock("@/components/categories/SnapshotButton", () => ({
  __esModule: true,
  default: ({ snapshot }: { snapshot?: unknown }) => (
    <button>{snapshot ? "Correct snapshot" : "Add Snapshot"}</button>
  ),
}));
jest.mock("@/components/categories/CategoryHistoryChart", () => ({
  __esModule: true,
  default: () => <div>History chart</div>,
}));
jest.mock("@/components/layout/ProductionPageLink", () => ({
  __esModule: true,
  default: () => null,
}));
const row: CategorySnapshot = {
  category_id: "1",
  slug: "basketball",
  name: "Basketball",
  snapshot_id: null,
  measured_on: null,
  card_count: null,
  previous_date: null,
  previous_count: null,
  count_change: null,
  ranking: null,
  previous_ranking: null,
  rank_delta: null,
  trend_rank: null,
  difference: null,
  previous_difference: null,
  diff_delta: null,
  trend_overall: null,
  diff_sign_changed: null,
};
beforeEach(() => {
  jest.resetAllMocks();
  mockCan.mockResolvedValue(false);
  mockHistory.mockResolvedValue([]);
});
it("distinguishes no configured categories and loading", () => {
  render(
    <>
      <Overview categories={[]} />
      <Loading />
    </>,
  );
  expect(
    screen.getByText("No categories are configured yet."),
  ).toBeInTheDocument();
  expect(screen.getByText("Loading category counts…")).toHaveAttribute(
    "role",
    "status",
  );
});
it("distinguishes untracked and recorded zero with no invented comparison", () => {
  render(
    <Overview
      categories={[
        row,
        {
          ...row,
          slug: "non-sport",
          name: "Non-sport",
          snapshot_id: "2",
          card_count: 0,
          measured_on: "2026-10-01",
        },
      ]}
    />,
  );
  expect(screen.getByText("Not tracked yet")).toBeInTheDocument();
  expect(screen.getByText("Oct 01, 2026")).toBeInTheDocument();
  expect(screen.getByText("No previous measurement")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Non-sport" })).toHaveAttribute(
    "href",
    "/cardattack/categories/non-sport",
  );
});
it("shows prerequisite/unavailable state rather than empty when reads fail", async () => {
  mockList.mockRejectedValue(new Error("missing schema"));
  render(await Page());
  expect(screen.getByText("Category counts unavailable")).toBeInTheDocument();
  expect(
    screen.queryByText("No categories are configured yet."),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Add Snapshot" }),
  ).not.toBeInTheDocument();
});
it("gates overview create controls and handles no configured categories", async () => {
  mockList.mockResolvedValue([row]);
  mockCan.mockResolvedValue(true);
  render(await Page());
  expect(
    screen.getByRole("button", { name: "Add Snapshot" }),
  ).toBeInTheDocument();
});
it("shows first-use detail guidance", async () => {
  mockGet.mockResolvedValue(row);
  render(await Detail({ params: Promise.resolve({ slug: row.slug }) }));
  expect(
    screen.getByText(/Not tracked yet. Add the first snapshot/),
  ).toBeInTheDocument();
  expect(screen.getByText("No measurements recorded yet.")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("shows a dated latest, decrease and unchanged history with independent correction permission", async () => {
  mockGet.mockResolvedValue({
    ...row,
    snapshot_id: "3",
    measured_on: "2026-10-20",
    card_count: 0,
    previous_date: "2026-10-10",
    previous_count: 1,
    count_change: -1,
  });
  mockHistory.mockResolvedValue([
    { ...row, snapshot_id: "1", measured_on: "2026-10-01", card_count: 1 },
    {
      ...row,
      snapshot_id: "2",
      measured_on: "2026-10-10",
      card_count: 1,
      previous_date: "2026-10-01",
      previous_count: 1,
      count_change: 0,
    },
    {
      ...row,
      snapshot_id: "3",
      measured_on: "2026-10-20",
      card_count: 0,
      previous_date: "2026-10-10",
      count_change: -1,
    },
  ]);
  mockCan.mockImplementation(async (feature: string) =>
    feature.endsWith("correct"),
  );
  render(await Detail({ params: Promise.resolve({ slug: row.slug }) }));
  expect(
    screen.getAllByRole("button", { name: "Correct snapshot" }),
  ).toHaveLength(3);
  expect(
    screen.queryByRole("button", { name: "Add Snapshot" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("+0 since Oct 01, 2026")).toBeInTheDocument();
  expect(screen.getByText("-1 since Oct 10, 2026")).toBeInTheDocument();
  expect(screen.getAllByText("History chart")).toHaveLength(2);
});
it("shows unavailable detail if history fails", async () => {
  mockGet.mockResolvedValue(row);
  mockHistory.mockRejectedValue(new Error("offline"));
  render(await Detail({ params: Promise.resolve({ slug: row.slug }) }));
  expect(screen.getByText("Category counts unavailable")).toBeInTheDocument();
});
