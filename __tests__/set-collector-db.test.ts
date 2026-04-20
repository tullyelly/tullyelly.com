/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getLatestSetCollectorSnapshotFromDb,
  getSetCollectorSummaryForDateFromDb,
  getSetCollectorSummaryFromDb,
  listSetCollectorSnapshotsFromDb,
  listSetCollectorSummariesFromDb,
} from "@/lib/set-collector-db";
import {
  formatSetCollectorPercentComplete,
  formatSetCollectorRating,
  normalizeSetCollectorSlug,
} from "@/lib/set-collector-types";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalJestWorkerId = process.env.JEST_WORKER_ID;
const originalSkipDb = process.env.SKIP_DB;
const originalNextPhase = process.env.NEXT_PHASE;

describe("set collector db helpers", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mutableEnv.NODE_ENV = "development";
    delete process.env.JEST_WORKER_ID;
    delete process.env.SKIP_DB;
    delete process.env.NEXT_PHASE;
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
    }

    if (originalJestWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID;
    } else {
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    }

    if (originalSkipDb === undefined) {
      delete process.env.SKIP_DB;
    } else {
      process.env.SKIP_DB = originalSkipDb;
    }

    if (originalNextPhase === undefined) {
      delete process.env.NEXT_PHASE;
    } else {
      process.env.NEXT_PHASE = originalNextPhase;
    }
  });

  it("normalizes set collector slugs into kebab-case", () => {
    expect(normalizeSetCollectorSlug(" /1992 Courtside Draft Pix/ ")).toBe(
      "1992-courtside-draft-pix",
    );
  });

  it("rejects blank set collector slugs", () => {
    expect(() => normalizeSetCollectorSlug("   ")).toThrow(
      "Set Collector lookup: slug must be a non-empty string.",
    );
  });

  it("formats set collector ratings to one decimal place", () => {
    expect(formatSetCollectorRating(9.25)).toBe("9.3/10");
  });

  it("formats completion percentages consistently", () => {
    expect(formatSetCollectorPercentComplete(33.3)).toBe("33.3%");
    expect(formatSetCollectorPercentComplete(100)).toBe("100%");
  });

  it("lists normalized set collector summaries from the DB", async () => {
    mockSql.mockResolvedValue([
      {
        id: "12",
        set_slug: "1991-92-upper-deck",
        set_name: "1991-92 Upper Deck",
        release_year: "1991",
        manufacturer: "Upper Deck",
        tcdb_set_url: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
        completed_set_photo_path: "/images/optimus/1991-92-upper-deck/hero.webp",
        category_tag: "basketball",
        rating: "9.50",
        cards_owned: "456",
        total_cards: "500",
        tcdb_trade_id: "960943",
        first_snapshot_date: "2026-03-01",
        latest_snapshot_date: "2026-04-10",
        snapshot_count: "3",
      },
    ]);

    await expect(listSetCollectorSummariesFromDb()).resolves.toEqual([
      {
        id: 12,
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
        releaseYear: 1991,
        manufacturer: "Upper Deck",
        tcdbSetUrl:
          "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
        completedSetPhotoPath: "/images/optimus/1991-92-upper-deck/hero.webp",
        categoryTag: "basketball",
        rating: 9.5,
        cardsOwned: 456,
        totalCards: 500,
        cardsMissing: 44,
        percentComplete: 91.2,
        tcdbTradeId: "960943",
        firstSnapshotDate: "2026-03-01",
        latestSnapshotDate: "2026-04-10",
        snapshotCount: 3,
      },
    ]);
  });

  it("returns a normalized set collector summary by numeric id", async () => {
    mockSql.mockResolvedValue([
      {
        id: 7,
        set_slug: "1990-91-hoops",
        set_name: "1990-91 Hoops",
        release_year: "1990",
        manufacturer: "Hoops",
        tcdb_set_url: "https://www.tcdb.com/ViewSet.cfm/sid/2110/1990-91-Hoops",
        completed_set_photo_path: "/images/optimus/1990-91-hoops/hero.webp",
        category_tag: null,
        rating: "8.75",
        cards_owned: "365",
        total_cards: "440",
        tcdb_trade_id: null,
        first_snapshot_date: "2026-02-12",
        latest_snapshot_date: "2026-04-14",
        snapshot_count: "5",
      },
    ]);

    await expect(
      getSetCollectorSummaryFromDb(" /1990 91 Hoops/ "),
    ).resolves.toEqual({
      id: 7,
      setSlug: "1990-91-hoops",
      setName: "1990-91 Hoops",
      releaseYear: 1990,
      manufacturer: "Hoops",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2110/1990-91-Hoops",
      completedSetPhotoPath: "/images/optimus/1990-91-hoops/hero.webp",
      rating: 8.75,
      cardsOwned: 365,
      totalCards: 440,
      cardsMissing: 75,
      percentComplete: 83,
      firstSnapshotDate: "2026-02-12",
      latestSnapshotDate: "2026-04-14",
      snapshotCount: 5,
    });

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["1990-91-hoops"]);
  });

  it("allows unrated sets without a completed photo path", async () => {
    mockSql.mockResolvedValue([
      {
        id: 8,
        set_slug: "1993-topps-finest",
        set_name: "1993 Topps Finest",
        release_year: "1993",
        manufacturer: "Topps",
        tcdb_set_url: "https://www.tcdb.com/ViewSet.cfm/sid/9999/1993-Topps-Finest",
        completed_set_photo_path: null,
        category_tag: "baseball",
        rating: null,
        total_cards: "199",
        cards_owned: "120",
        tcdb_trade_id: null,
        first_snapshot_date: "2026-04-01",
        latest_snapshot_date: "2026-04-14",
        snapshot_count: "2",
      },
    ]);

    await expect(getSetCollectorSummaryFromDb("1993-topps-finest")).resolves.toEqual({
      id: 8,
      setSlug: "1993-topps-finest",
      setName: "1993 Topps Finest",
      releaseYear: 1993,
      manufacturer: "Topps",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/9999/1993-Topps-Finest",
      categoryTag: "baseball",
      totalCards: 199,
      cardsOwned: 120,
      cardsMissing: 79,
      percentComplete: 60.3,
      firstSnapshotDate: "2026-04-01",
      latestSnapshotDate: "2026-04-14",
      snapshotCount: 2,
    });
  });

  it("returns a summary row bound to one exact snapshot date", async () => {
    mockSql.mockResolvedValue([
      {
        id: 12,
        set_slug: "1992-courtside-draft-pix",
        set_name: "1992 Courtside Draft Pix",
        release_year: "1992",
        manufacturer: "Courtside",
        tcdb_set_url: "https://www.tcdb.com/ViewSet.cfm/sid/56520/1992-Courtside-Draft-Pix",
        completed_set_photo_path: null,
        category_tag: "basketball",
        rating: "8.00",
        cards_owned: "133",
        total_cards: "147",
        tcdb_trade_id: "1004001",
        first_snapshot_date: "2026-04-01",
        latest_snapshot_date: "2026-04-19",
        snapshot_count: "4",
      },
    ]);

    await expect(
      getSetCollectorSummaryForDateFromDb(
        " /1992 Courtside Draft Pix/ ",
        "2026-04-10T04:00:00.000Z",
      ),
    ).resolves.toEqual({
      id: 12,
      setSlug: "1992-courtside-draft-pix",
      setName: "1992 Courtside Draft Pix",
      releaseYear: 1992,
      manufacturer: "Courtside",
      tcdbSetUrl:
        "https://www.tcdb.com/ViewSet.cfm/sid/56520/1992-Courtside-Draft-Pix",
      categoryTag: "basketball",
      rating: 8,
      cardsOwned: 133,
      totalCards: 147,
      cardsMissing: 14,
      percentComplete: 90.5,
      tcdbTradeId: "1004001",
      firstSnapshotDate: "2026-04-01",
      latestSnapshotDate: "2026-04-19",
      snapshotCount: 4,
    });

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["2026-04-10", "1992-courtside-draft-pix"]);
  });

  it("returns null for invalid dated summary lookups without querying", async () => {
    await expect(
      getSetCollectorSummaryForDateFromDb(
        "1992-courtside-draft-pix",
        "not-a-date",
      ),
    ).resolves.toBeNull();

    expect(mockSql).not.toHaveBeenCalled();
  });

  it("returns ordered snapshot rows with derived progress fields", async () => {
    mockSql.mockResolvedValue([
      {
        id: "101",
        set_collector_header_id: "12",
        snapshot_date: "2026-04-01",
        cards_owned: "450",
        total_cards: "500",
        tcdb_trade_id: null,
      },
      {
        id: "102",
        set_collector_header_id: "12",
        snapshot_date: "2026-04-10",
        cards_owned: "456",
        total_cards: "500",
        tcdb_trade_id: "960943",
      },
    ]);

    await expect(
      listSetCollectorSnapshotsFromDb("1991-92-upper-deck"),
    ).resolves.toEqual([
      {
        id: 101,
        setId: 12,
        snapshotDate: "2026-04-01",
        cardsOwned: 450,
        totalCards: 500,
        cardsMissing: 50,
        percentComplete: 90,
      },
      {
        id: 102,
        setId: 12,
        snapshotDate: "2026-04-10",
        cardsOwned: 456,
        totalCards: 500,
        cardsMissing: 44,
        percentComplete: 91.2,
        tcdbTradeId: "960943",
      },
    ]);

    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual(["1991-92-upper-deck"]);
  });

  it("returns the latest snapshot for one tracked set", async () => {
    mockSql.mockResolvedValue([
      {
        id: "102",
        set_collector_header_id: "12",
        snapshot_date: "2026-04-10",
        cards_owned: "456",
        total_cards: "500",
        tcdb_trade_id: "960943",
      },
    ]);

    await expect(
      getLatestSetCollectorSnapshotFromDb("1991-92-upper-deck"),
    ).resolves.toEqual({
      id: 102,
      setId: 12,
      snapshotDate: "2026-04-10",
      cardsOwned: 456,
      totalCards: 500,
      cardsMissing: 44,
      percentComplete: 91.2,
      tcdbTradeId: "960943",
    });
  });

  it("derives missing cards and rounded completion from snapshot counts", async () => {
    mockSql.mockResolvedValue([
      {
        id: "103",
        set_collector_header_id: "12",
        snapshot_date: "2026-04-11",
        cards_owned: "1",
        total_cards: "3",
        tcdb_trade_id: null,
      },
    ]);

    await expect(
      getLatestSetCollectorSnapshotFromDb("1991-92-upper-deck"),
    ).resolves.toEqual({
      id: 103,
      setId: 12,
      snapshotDate: "2026-04-11",
      cardsOwned: 1,
      totalCards: 3,
      cardsMissing: 2,
      percentComplete: 33.3,
    });
  });

  it("returns defensive fallbacks when DB access is explicitly skipped", async () => {
    process.env.SKIP_DB = "true";

    await expect(listSetCollectorSummariesFromDb()).resolves.toEqual([]);
    await expect(getSetCollectorSummaryFromDb("1991-92-upper-deck")).resolves.toBeNull();
    await expect(
      listSetCollectorSnapshotsFromDb("1991-92-upper-deck"),
    ).resolves.toEqual([]);
    await expect(
      getLatestSetCollectorSnapshotFromDb("1991-92-upper-deck"),
    ).resolves.toBeNull();
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("falls back cleanly when a DB row contains invalid progress counts", async () => {
    mockSql.mockResolvedValue([
      {
        id: "12",
        set_slug: "1991-92-upper-deck",
        set_name: "1991-92 Upper Deck",
        release_year: "1991",
        manufacturer: "Upper Deck",
        tcdb_set_url: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
        completed_set_photo_path: "/images/optimus/1991-92-upper-deck/hero.webp",
        category_tag: "basketball",
        rating: "9.50",
        cards_owned: "600",
        total_cards: "500",
        tcdb_trade_id: null,
        first_snapshot_date: "2026-03-01",
        latest_snapshot_date: "2026-04-10",
        snapshot_count: "3",
      },
    ]);

    await expect(getSetCollectorSummaryFromDb("1991-92-upper-deck")).resolves.toBeNull();
  });

  it("falls back cleanly when a snapshot row contains invalid progress counts", async () => {
    mockSql.mockResolvedValue([
      {
        id: "103",
        set_collector_header_id: "12",
        snapshot_date: "2026-04-11",
        cards_owned: "10",
        total_cards: "0",
        tcdb_trade_id: null,
      },
    ]);

    await expect(
      getLatestSetCollectorSnapshotFromDb("1991-92-upper-deck"),
    ).resolves.toBeNull();
  });
});
