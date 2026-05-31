import { render, screen } from "@testing-library/react";

const mockListNumberOneTcdbHomieRankings = jest.fn();
const mockListRecentTcdbHomieFallers = jest.fn();
const mockListRecentTcdbHomieRisers = jest.fn();
const mockListTopTcdbHomieRankings = jest.fn();
const mockGetTcdbRanking = jest.fn();
const mockListNumberOneTcdbClanRankings = jest.fn();
const mockListRecentTcdbClanFallers = jest.fn();
const mockListRecentTcdbClanRisers = jest.fn();
const mockListTopTcdbClanRankings = jest.fn();
const mockGetTcdbClanRanking = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));
jest.mock("@/lib/data/tcdb", () => ({
  getTcdbRanking: (...args: unknown[]) => mockGetTcdbRanking(...args),
  listNumberOneTcdbHomieRankings: (...args: unknown[]) =>
    mockListNumberOneTcdbHomieRankings(...args),
  listRecentTcdbHomieFallers: (...args: unknown[]) =>
    mockListRecentTcdbHomieFallers(...args),
  listRecentTcdbHomieRisers: (...args: unknown[]) =>
    mockListRecentTcdbHomieRisers(...args),
  listTopTcdbHomieRankings: (...args: unknown[]) =>
    mockListTopTcdbHomieRankings(...args),
}));
jest.mock("@/lib/data/tcdb-clans", () => ({
  getTcdbClanRanking: (...args: unknown[]) => mockGetTcdbClanRanking(...args),
  listNumberOneTcdbClanRankings: (...args: unknown[]) =>
    mockListNumberOneTcdbClanRankings(...args),
  listRecentTcdbClanFallers: (...args: unknown[]) =>
    mockListRecentTcdbClanFallers(...args),
  listRecentTcdbClanRisers: (...args: unknown[]) =>
    mockListRecentTcdbClanRisers(...args),
  listTopTcdbClanRankings: (...args: unknown[]) =>
    mockListTopTcdbClanRankings(...args),
}));

import RootPage from "@/app/cardattack/tcdb-rankings/page";
import HomieDetailPage from "@/app/cardattack/tcdb-rankings/[id]/page";
import ClanDetailPage from "@/app/cardattack/tcdb-rankings/clans/[slug]/page";
import TCDBRankingRowClient from "@/components/tcdb/TCDBRankingRowClient";

const homieRanking = {
  homie_id: 34,
  name: "Giannis Antetokounmpo",
  card_count: 500,
  ranking: 1,
  ranking_at: "2026-05-01",
  difference: 5,
  rank_delta: 1,
  diff_delta: 2,
  trend_rank: "up",
  trend_overall: "up",
  diff_sign_changed: false,
};

const clanRanking = {
  clan_id: 12,
  name: "Milwaukee Bucks",
  slug: "milwaukee-bucks",
  card_count: 400,
  ranking: 1,
  ranking_at: "2026-05-01",
  difference: 10,
  rank_delta: 2,
  diff_delta: 4,
  trend_rank: "up",
  trend_overall: "up",
  diff_sign_changed: false,
};

describe("TCDB rankings pages", () => {
  beforeEach(() => {
    mockListNumberOneTcdbHomieRankings.mockReset();
    mockListRecentTcdbHomieFallers.mockReset();
    mockListRecentTcdbHomieRisers.mockReset();
    mockListTopTcdbHomieRankings.mockReset();
    mockGetTcdbRanking.mockReset();
    mockListNumberOneTcdbClanRankings.mockReset();
    mockListRecentTcdbClanFallers.mockReset();
    mockListRecentTcdbClanRisers.mockReset();
    mockListTopTcdbClanRankings.mockReset();
    mockGetTcdbClanRanking.mockReset();
  });

  it("renders the consolidated landing sections and detail links", async () => {
    mockListNumberOneTcdbHomieRankings.mockResolvedValue([homieRanking]);
    mockListNumberOneTcdbClanRankings.mockResolvedValue([clanRanking]);
    mockListTopTcdbHomieRankings.mockResolvedValue([homieRanking]);
    mockListTopTcdbClanRankings.mockResolvedValue([clanRanking]);
    mockListRecentTcdbHomieRisers.mockResolvedValue([homieRanking]);
    mockListRecentTcdbHomieFallers.mockResolvedValue([homieRanking]);
    mockListRecentTcdbClanRisers.mockResolvedValue([clanRanking]);
    mockListRecentTcdbClanFallers.mockResolvedValue([clanRanking]);

    render(await RootPage());

    expect(
      screen.getByRole("heading", { name: "#1 Homies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "#1 Clans" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top 5 Homies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top 5 Clans" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Homie Risers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Clan Fallers" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Giannis Antetokounmpo" })[0],
    ).toHaveAttribute("href", "/cardattack/tcdb-rankings/34");
    expect(
      screen.getAllByRole("link", { name: "Milwaukee Bucks" })[0],
    ).toHaveAttribute(
      "href",
      "/cardattack/tcdb-rankings/clans/milwaukee-bucks",
    );
  });

  it("renders homie detail as a page", async () => {
    mockGetTcdbRanking.mockResolvedValue(homieRanking);

    render(
      await HomieDetailPage({
        params: Promise.resolve({ id: "34" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Giannis Antetokounmpo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jersey / Homie ID")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders clan detail as a page", async () => {
    mockGetTcdbClanRanking.mockResolvedValue(clanRanking);

    render(
      await ClanDetailPage({
        params: Promise.resolve({ slug: "milwaukee-bucks" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Milwaukee Bucks" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders TCDB ranking row links without dialog attributes", () => {
    render(
      <TCDBRankingRowClient
        href="/cardattack/tcdb-rankings/34"
        name="Giannis Antetokounmpo"
      />,
    );

    const link = screen.getByTestId("ranking-detail-trigger");
    expect(link).toHaveAttribute("href", "/cardattack/tcdb-rankings/34");
    expect(link).not.toHaveAttribute("aria-haspopup");
  });
});
