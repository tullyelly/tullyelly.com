import { render, screen } from "@testing-library/react";

const mockListNumberOneTcdbHomieRankings = jest.fn();
const mockListRecentTcdbHomieFallers = jest.fn();
const mockListRecentTcdbHomieRisers = jest.fn();
const mockListTopTcdbHomieRankings = jest.fn();
const mockListTcdbRankings = jest.fn();
const mockGetHomieTcdbRankingByRouteKey = jest.fn();
const mockListNumberOneTcdbClanRankings = jest.fn();
const mockListRecentTcdbClanFallers = jest.fn();
const mockListRecentTcdbClanRisers = jest.fn();
const mockListTopTcdbClanRankings = jest.fn();
const mockGetTcdbClanRankingsBySlug = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
  usePathname: () => "/cardattack/homies",
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/lib/authz", () => ({
  canCurrentUser: jest.fn().mockResolvedValue(false),
}));
jest.mock("@/app/cardattack/tcdb-rankings/_lib/getCurrentDate", () => ({
  getCurrentDateIso: jest.fn().mockResolvedValue("2026-05-01"),
}));
jest.mock("@/app/cardattack/tcdb-rankings/_lib/getHomieOptions", () => ({
  getHomieOptions: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/lib/data/tcdb", () => ({
  getHomieTcdbRankingByRouteKey: (...args: unknown[]) =>
    mockGetHomieTcdbRankingByRouteKey(...args),
  listTcdbRankings: (...args: unknown[]) => mockListTcdbRankings(...args),
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
  formatClanSportLabel: (sport: string) =>
    sport
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  getTcdbClanRankingsBySlug: (...args: unknown[]) =>
    mockGetTcdbClanRankingsBySlug(...args),
  listNumberOneTcdbClanRankings: (...args: unknown[]) =>
    mockListNumberOneTcdbClanRankings(...args),
  listRecentTcdbClanFallers: (...args: unknown[]) =>
    mockListRecentTcdbClanFallers(...args),
  listRecentTcdbClanRisers: (...args: unknown[]) =>
    mockListRecentTcdbClanRisers(...args),
  listTopTcdbClanRankings: (...args: unknown[]) =>
    mockListTopTcdbClanRankings(...args),
}));

import HomiesPage from "@/app/cardattack/homies/page";
import HomieDetailPage from "@/app/cardattack/homies/[tagSlugOrId]/page";
import ClanDetailPage from "@/app/cardattack/tcdb-rankings/clans/[slug]/page";
import TCDBRankingRowClient from "@/components/tcdb/TCDBRankingRowClient";

const homieRanking = {
  homie_id: 34,
  tag_slug: "freak",
  route_slug: "freak",
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
  sport: "basketball",
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
    mockListTcdbRankings.mockReset();
    mockGetHomieTcdbRankingByRouteKey.mockReset();
    mockListNumberOneTcdbClanRankings.mockReset();
    mockListRecentTcdbClanFallers.mockReset();
    mockListRecentTcdbClanRisers.mockReset();
    mockListTopTcdbClanRankings.mockReset();
    mockGetTcdbClanRankingsBySlug.mockReset();
  });

  it("renders the homies list page and preferred detail links", async () => {
    mockListTcdbRankings.mockResolvedValue({
      data: [homieRanking],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });

    render(
      await HomiesPage({
        searchParams: Promise.resolve(undefined),
      }),
    );

    expect(screen.getByRole("heading", { name: "Homies" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Overview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Clans" }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByTestId("ranking-detail-trigger")) {
      expect(link).toHaveAttribute("href", "/cardattack/homies/freak");
    }
  });

  it("renders homie detail as a page", async () => {
    mockGetHomieTcdbRankingByRouteKey.mockResolvedValue(homieRanking);

    render(
      await HomieDetailPage({
        params: Promise.resolve({ tagSlugOrId: "freak" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Giannis Antetokounmpo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jersey 34")).toBeInTheDocument();
    expect(screen.queryByText("Homie 34")).not.toBeInTheDocument();
    expect(screen.getByText("Jersey / Homie ID")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to homies" }),
    ).toHaveAttribute("href", "/cardattack/homies");
    expect(
      screen.queryByRole("link", { name: "Homie rankings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockGetHomieTcdbRankingByRouteKey).toHaveBeenCalledWith("freak");
  });

  it("renders homie detail with numeric fallback when no tag slug exists", async () => {
    mockGetHomieTcdbRankingByRouteKey.mockResolvedValue({
      ...homieRanking,
      tag_slug: null,
      route_slug: "34",
    });

    render(
      await HomieDetailPage({
        params: Promise.resolve({ tagSlugOrId: "34" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Giannis Antetokounmpo" }),
    ).toBeInTheDocument();
    expect(mockGetHomieTcdbRankingByRouteKey).toHaveBeenCalledWith("34");
  });

  it("renders clan detail as a page", async () => {
    mockGetTcdbClanRankingsBySlug.mockResolvedValue([
      clanRanking,
      { ...clanRanking, sport: "football", card_count: 250 },
    ]);

    render(
      await ClanDetailPage({
        params: Promise.resolve({ slug: "milwaukee-bucks" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Milwaukee Bucks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Basketball" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Football" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sport")).toHaveLength(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders TCDB ranking row links without dialog attributes", () => {
    render(
      <TCDBRankingRowClient
        href="/cardattack/homies/freak"
        name="Giannis Antetokounmpo"
      />,
    );

    const link = screen.getByTestId("ranking-detail-trigger");
    expect(link).toHaveAttribute("href", "/cardattack/homies/freak");
    expect(link).not.toHaveAttribute("aria-haspopup");
  });
});
