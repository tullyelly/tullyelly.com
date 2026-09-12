import { render, screen, within } from "@testing-library/react";

const mockGetTcdbClanCollectionScoreboard = jest.fn();
const mockListTcdbClanRankings = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/cardattack/clans",
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () =>
    new URLSearchParams("q=cream&sport=football&trend=up&page=3&pageSize=20"),
}));
jest.mock("@/lib/data/tcdb", () => ({
  isTrend: (value: string | null | undefined) =>
    value === "up" || value === "down" || value === "flat",
}));
jest.mock("@/lib/data/tcdb-clans", () => ({
  getTcdbClanCollectionScoreboard: (...args: unknown[]) =>
    mockGetTcdbClanCollectionScoreboard(...args),
  listTcdbClanRankings: (...args: unknown[]) =>
    mockListTcdbClanRankings(...args),
}));

import { renderTcdbClanRankingsPage } from "@/app/cardattack/clans/renderTcdbClanRankingsPage";

describe("Clans landing page", () => {
  beforeEach(() => {
    mockGetTcdbClanCollectionScoreboard.mockReset();
    mockListTcdbClanRankings.mockReset();

    mockGetTcdbClanCollectionScoreboard.mockResolvedValue({
      tracked_clans: 18,
      total_current_cards: 12482,
      number_one_rankings: 7,
      sports: ["baseball", "basketball", "football", "hockey"],
    });
    mockListTcdbClanRankings.mockResolvedValue({
      data: [],
      meta: {
        page: 3,
        pageSize: 20,
        total: 0,
        totalPages: 1,
        q: "cream",
        sport: "football",
        trend: "up",
      },
    });
  });

  it("renders the collection scoreboard and forwards all ranking filters", async () => {
    render(
      await renderTcdbClanRankingsPage(
        Promise.resolve({
          page: "3",
          pageSize: "20",
          q: "cream",
          sport: "FOOTBALL",
          trend: "up",
        }),
      ),
    );

    expect(
      screen.getByText(
        "Team collections across CardAttack, with current TCDb rankings and collection growth in one place.",
      ),
    ).toBeInTheDocument();

    const scoreboard = screen.getByRole("region", {
      name: "Clan collection scoreboard",
    });
    expect(within(scoreboard).getByText("18")).toBeInTheDocument();
    expect(within(scoreboard).getByText("12,482")).toBeInTheDocument();
    expect(within(scoreboard).getByText("7")).toBeInTheDocument();
    expect(within(scoreboard).getByText("4")).toBeInTheDocument();

    expect(mockListTcdbClanRankings).toHaveBeenCalledWith({
      page: 3,
      pageSize: 20,
      q: "cream",
      sport: "football",
      trend: "up",
    });
    expect(mockGetTcdbClanCollectionScoreboard).toHaveBeenCalledTimes(1);
  });
});
