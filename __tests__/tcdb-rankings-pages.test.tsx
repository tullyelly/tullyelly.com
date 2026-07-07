import { render, screen } from "@testing-library/react";

const mockListNumberOneTcdbHomieRankings = jest.fn();
const mockListRecentTcdbHomieFallers = jest.fn();
const mockListRecentTcdbHomieRisers = jest.fn();
const mockListTopTcdbHomieRankings = jest.fn();
const mockListTcdbRankings = jest.fn();
const mockGetHomieTcdbRankingByRouteKey = jest.fn();
const mockListHomieTcdbSnapshotHistory = jest.fn();
const mockGetStoredTagMetadataForHrefKind = jest.fn();
const mockListChronicleTagDisplayNames = jest.fn();
const mockGetTaggedPosts = jest.fn();
const mockListNumberOneTcdbClanRankings = jest.fn();
const mockListRecentTcdbClanFallers = jest.fn();
const mockListRecentTcdbClanRisers = jest.fn();
const mockListTopTcdbClanRankings = jest.fn();
const mockGetTcdbClanRankingsBySlug = jest.fn();
const mockListClanTcdbSnapshotHistory = jest.fn();

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
  listHomieTcdbSnapshotHistory: (...args: unknown[]) =>
    mockListHomieTcdbSnapshotHistory(...args),
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
jest.mock("@/lib/tags-server", () => ({
  getStoredTagMetadataForHrefKind: (...args: unknown[]) =>
    mockGetStoredTagMetadataForHrefKind(...args),
}));
jest.mock("@/lib/chronicle-person-tags", () => ({
  listChronicleTagDisplayNames: (...args: unknown[]) =>
    mockListChronicleTagDisplayNames(...args),
}));
jest.mock("@/lib/blog", () => ({
  getTaggedPosts: (...args: unknown[]) => mockGetTaggedPosts(...args),
}));
jest.mock("@/components/tcdb/HomieCardCountSparkline", () => ({
  __esModule: true,
  default: ({ snapshots }: { snapshots: unknown[] }) => (
    <div
      data-testid="homie-card-count-sparkline"
      data-snapshots={String(snapshots.length)}
    />
  ),
}));
jest.mock("@/components/tcdb/ClanCardCountSparkline", () => ({
  __esModule: true,
  default: ({ snapshots }: { snapshots: unknown[] }) => (
    <div
      data-testid="clan-card-count-sparkline"
      data-snapshots={String(snapshots.length)}
      data-sport={
        String((snapshots[0] as { sport?: string } | undefined)?.sport ?? "")
      }
    />
  ),
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
  listClanTcdbSnapshotHistory: (...args: unknown[]) =>
    mockListClanTcdbSnapshotHistory(...args),
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
import ClanDetailPage from "@/app/cardattack/clans/[slug]/page";
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
  tag_slug: "bucks-n-six",
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
    mockListHomieTcdbSnapshotHistory.mockReset();
    mockListHomieTcdbSnapshotHistory.mockResolvedValue([
      {
        homie_id: 34,
        card_count: 450,
        ranking: 2,
        ranking_at: "2026-04-01",
        difference: 4,
      },
      {
        homie_id: 34,
        card_count: 500,
        ranking: 1,
        ranking_at: "2026-05-01",
        difference: 5,
      },
    ]);
    mockGetStoredTagMetadataForHrefKind.mockReset();
    mockGetStoredTagMetadataForHrefKind.mockResolvedValue(null);
    mockListChronicleTagDisplayNames.mockReset();
    mockListChronicleTagDisplayNames.mockReturnValue([]);
    mockGetTaggedPosts.mockReset();
    mockGetTaggedPosts.mockReturnValue([]);
    mockListNumberOneTcdbClanRankings.mockReset();
    mockListRecentTcdbClanFallers.mockReset();
    mockListRecentTcdbClanRisers.mockReset();
    mockListTopTcdbClanRankings.mockReset();
    mockGetTcdbClanRankingsBySlug.mockReset();
    mockListClanTcdbSnapshotHistory.mockReset();
    mockListClanTcdbSnapshotHistory.mockResolvedValue([
      {
        clan_id: 12,
        sport: "basketball",
        card_count: 120,
        ranking: 2,
        ranking_at: "2026-04-01",
        difference: 6,
      },
      {
        clan_id: 12,
        sport: "basketball",
        card_count: 136,
        ranking: 1,
        ranking_at: "2026-05-01",
        difference: 8,
      },
      {
        clan_id: 12,
        sport: "football",
        card_count: 575,
        ranking: 2,
        ranking_at: "2026-04-01",
        difference: 70,
      },
      {
        clan_id: 12,
        sport: "football",
        card_count: 600,
        ranking: 1,
        ranking_at: "2026-05-01",
        difference: 75,
      },
    ]);
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
    expect(screen.queryByText("Jersey / Homie ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Rank Delta")).not.toBeInTheDocument();
    expect(screen.queryByText("Difference Delta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diff Sign Changed")).not.toBeInTheDocument();
    expect(screen.getByText("Rank Trend")).toBeInTheDocument();
    expect(screen.queryByText("Current Rank")).not.toBeInTheDocument();
    const tcdbRankText = screen
      .getAllByText("TCDb")
      .find((node) => node.parentElement?.textContent === "TCDb RANK");
    const summaryGrid = tcdbRankText?.closest("dl");
    expect(summaryGrid).toHaveClass("xl:grid-cols-6");
    const summaryCard = summaryGrid?.closest("section");
    expect(summaryGrid).not.toContainElement(
      screen.getByTestId("homie-card-count-sparkline"),
    );
    expect(summaryCard).toContainElement(
      screen.getByTestId("homie-card-count-sparkline"),
    );
    expect(summaryCard).toHaveTextContent("TCDb CARD HISTORY");
    expect(screen.getByTestId("homie-card-count-sparkline")).toHaveAttribute(
      "data-snapshots",
      "2",
    );
    expect(
      screen.getByRole("link", { name: "Back to homies" }),
    ).toHaveAttribute("href", "/cardattack/homies");
    expect(
      screen.queryByRole("link", { name: "Homie rankings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockGetHomieTcdbRankingByRouteKey).toHaveBeenCalledWith("freak");
    expect(mockListHomieTcdbSnapshotHistory).toHaveBeenCalledWith(34);
  });

  it("renders Chronicle display names for homie tag metadata", async () => {
    mockGetHomieTcdbRankingByRouteKey.mockResolvedValue(homieRanking);
    mockGetStoredTagMetadataForHrefKind.mockResolvedValue({
      slug: "freak",
      displayName: "Giannis Antetokounmpo",
      href: "/cardattack/homies/freak",
      hrefKind: "homie",
      isClickable: true,
      meta: {},
    });
    mockListChronicleTagDisplayNames.mockReturnValue([
      { displayName: "giannis", count: 2, chronicleCount: 2 },
      { displayName: "the greek freak", count: 1, chronicleCount: 1 },
    ]);
    mockGetTaggedPosts.mockReturnValue([
      {
        slug: "ultralight-beam",
        title: "Ultralight Beam",
        summary: "A chronicle with a Giannis sidebar.",
        date: "2026-07-06",
        url: "/shaolin/ultralight-beam",
        tags: ["freak"],
      },
    ]);

    render(
      await HomieDetailPage({
        params: Promise.resolve({ tagSlugOrId: "freak" }),
      }),
    );

    expect(
      screen.getByText("chronicle display names for giannis antetokounmpo"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Chronicle names")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Display names for Giannis Antetokounmpo",
      }),
    ).not.toBeInTheDocument();
    const chronicleNamesSection = screen
      .getByText("chronicle display names for giannis antetokounmpo")
      .closest("section");
    const chronicleNamesItems = chronicleNamesSection?.querySelectorAll("li");
    expect(chronicleNamesItems?.[0]).toHaveTextContent("Default tag");
    expect(chronicleNamesItems?.[0]).toHaveTextContent("#freak");
    expect(chronicleNamesItems?.[0]).toHaveTextContent("Total uses");
    expect(chronicleNamesItems?.[0]).toHaveTextContent("3 mentions");
    expect(chronicleNamesItems?.[1]).toHaveTextContent("giannis");
    expect(screen.getByText("giannis")).toBeInTheDocument();
    expect(screen.getByText("the greek freak")).toBeInTheDocument();
    expect(
      screen.getByText("2 mentions across 2 chronicles"),
    ).toBeInTheDocument();
    expect(screen.getByText("Default tag")).toBeInTheDocument();
    expect(screen.getByText("#freak")).toBeInTheDocument();
    expect(screen.getByText("Total uses")).toBeInTheDocument();
    expect(screen.getByText("3 mentions")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Chronicle tag" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "recent chronicles for freak" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ultralight Beam" }),
    ).toHaveAttribute("href", "/shaolin/ultralight-beam");
    expect(
      screen.getByText("A chronicle with a Giannis sidebar."),
    ).toBeInTheDocument();
    expect(mockGetStoredTagMetadataForHrefKind).toHaveBeenCalledWith({
      slug: "freak",
      href: "/cardattack/homies/freak",
      hrefKind: "homie",
    });
    expect(mockListChronicleTagDisplayNames).toHaveBeenCalledWith("freak");
    expect(mockGetTaggedPosts).toHaveBeenCalledWith("freak");
  });

  it("does not render Chronicle display names for non-homie tag metadata", async () => {
    mockGetHomieTcdbRankingByRouteKey.mockResolvedValue(homieRanking);
    mockGetStoredTagMetadataForHrefKind.mockResolvedValue({
      slug: "freak",
      displayName: "freak",
      href: "/shaolin/tags/freak",
      hrefKind: "tag",
      isClickable: true,
      meta: {},
    });

    render(
      await HomieDetailPage({
        params: Promise.resolve({ tagSlugOrId: "freak" }),
      }),
    );

    expect(screen.queryByText("Chronicle names")).not.toBeInTheDocument();
    expect(mockListChronicleTagDisplayNames).not.toHaveBeenCalled();
    expect(mockGetTaggedPosts).not.toHaveBeenCalled();
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

  it("renders Chronicle display names for numeric homie routes matched by href", async () => {
    mockGetHomieTcdbRankingByRouteKey.mockResolvedValue({
      ...homieRanking,
      tag_slug: null,
      route_slug: "34",
    });
    mockGetStoredTagMetadataForHrefKind.mockResolvedValue({
      slug: "freak",
      displayName: "Giannis Antetokounmpo",
      href: "/cardattack/homies/34",
      hrefKind: "homie",
      isClickable: true,
      meta: {},
    });
    mockListChronicleTagDisplayNames.mockReturnValue([
      { displayName: "giannis", count: 1, chronicleCount: 1 },
    ]);

    render(
      await HomieDetailPage({
        params: Promise.resolve({ tagSlugOrId: "34" }),
      }),
    );

    expect(
      screen.getByText("chronicle display names for giannis antetokounmpo"),
    ).toBeInTheDocument();
    expect(screen.getByText("Default tag")).toBeInTheDocument();
    expect(screen.getByText("#freak")).toBeInTheDocument();
    expect(screen.getByText("Total uses")).toBeInTheDocument();
    expect(screen.getByText("1 mention")).toBeInTheDocument();
    expect(mockGetStoredTagMetadataForHrefKind).toHaveBeenCalledWith({
      slug: null,
      href: "/cardattack/homies/34",
      hrefKind: "homie",
    });
    expect(mockListChronicleTagDisplayNames).toHaveBeenCalledWith("freak");
    expect(mockGetTaggedPosts).toHaveBeenCalledWith("freak");
  });

  it("renders clan detail as a page", async () => {
    mockGetStoredTagMetadataForHrefKind.mockResolvedValue({
      slug: "bucks-n-six",
      displayName: "Milwaukee Bucks",
      href: "/cardattack/clans/milwaukee-bucks",
      hrefKind: "clan",
      isClickable: true,
      meta: {},
    });
    mockListChronicleTagDisplayNames.mockReturnValue([
      { displayName: "bucks", count: 2, chronicleCount: 2 },
      { displayName: "bucks-n-six", count: 1, chronicleCount: 1 },
    ]);
    mockGetTaggedPosts.mockReturnValue([
      {
        slug: "wu-tang-clans",
        title: "wu-tang clans",
        summary: "A Chronicle with a Bucks clan tag.",
        date: "2026-07-06",
        url: "/shaolin/wu-tang-clans",
        tags: ["bucks-n-six"],
      },
    ]);
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
    expect(screen.queryByText("Sport")).not.toBeInTheDocument();
    expect(screen.queryByText("Slug")).not.toBeInTheDocument();
    expect(screen.queryByText("Rank Delta")).not.toBeInTheDocument();
    expect(screen.queryByText("Difference Delta")).not.toBeInTheDocument();
    expect(screen.queryByText("Diff Sign Changed")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to clans" })).toHaveAttribute(
      "href",
      "/cardattack/clans",
    );
    const [basketballChart, footballChart] = screen.getAllByTestId(
      "clan-card-count-sparkline",
    );
    const basketballSection = screen
      .getByRole("heading", { name: "Basketball" })
      .closest("section");
    const footballSection = screen
      .getByRole("heading", { name: "Football" })
      .closest("section");
    expect(basketballSection?.querySelector("dl")).toHaveClass(
      "xl:grid-cols-6",
    );
    expect(footballSection?.querySelector("dl")).toHaveClass("xl:grid-cols-6");
    expect(basketballSection).toHaveTextContent("TCDb CARD HISTORY");
    expect(basketballSection).toHaveTextContent("Rank Trend");
    expect(basketballSection).toContainElement(basketballChart);
    expect(basketballChart).toHaveAttribute("data-sport", "basketball");
    expect(basketballChart).toHaveAttribute("data-snapshots", "2");
    expect(footballSection).toContainElement(footballChart);
    expect(footballSection).toHaveTextContent("TCDb CARD HISTORY");
    expect(footballChart).toHaveAttribute("data-sport", "football");
    expect(footballChart).toHaveAttribute("data-snapshots", "2");
    expect(
      screen.getByText("chronicle display names for milwaukee bucks"),
    ).toBeInTheDocument();
    expect(screen.getByText("Default tag")).toBeInTheDocument();
    expect(screen.getByText("#bucks-n-six")).toBeInTheDocument();
    expect(screen.getByText("Total uses")).toBeInTheDocument();
    expect(screen.getByText("3 mentions")).toBeInTheDocument();
    expect(screen.getByText("bucks")).toBeInTheDocument();
    expect(screen.getByText("2 mentions across 2 chronicles")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "recent chronicles for bucks-n-six",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "wu-tang clans" }),
    ).toHaveAttribute("href", "/shaolin/wu-tang-clans");
    expect(
      screen.queryByRole("link", { name: "Clan rankings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockGetStoredTagMetadataForHrefKind).toHaveBeenCalledWith({
      slug: "bucks-n-six",
      href: "/cardattack/clans/milwaukee-bucks",
      hrefKind: "clan",
    });
    expect(mockListChronicleTagDisplayNames).toHaveBeenCalledWith(
      "bucks-n-six",
    );
    expect(mockGetTaggedPosts).toHaveBeenCalledWith("bucks-n-six");
    expect(mockListClanTcdbSnapshotHistory).toHaveBeenCalledWith(12);
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
