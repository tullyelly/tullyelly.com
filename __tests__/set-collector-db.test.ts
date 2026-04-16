/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getLatestSetCollectorSnapshotFromDb,
  getSetCollectorSummaryFromDb,
  listSetCollectorSnapshotsFromDb,
  listSetCollectorSummariesFromDb,
} from "@/lib/set-collector-db";
import {
  formatSetCollectorPercentComplete,
  formatSetCollectorRating,
  normalizeSetCollectorId,
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

  it("rejects non-numeric set collector ids", () => {
    expect(() => normalizeSetCollectorId("abc")).toThrow(
      "Set Collector lookup: id must be a positive integer.",
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

    await expect(getSetCollectorSummaryFromDb(" 7 ")).resolves.toEqual({
      id: 7,
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
    expect(values).toEqual([7]);
  });

  it("allows unrated sets without a completed photo path", async () => {
    mockSql.mockResolvedValue([
      {
        id: 8,
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

    await expect(getSetCollectorSummaryFromDb(8)).resolves.toEqual({
      id: 8,
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

    await expect(listSetCollectorSnapshotsFromDb(12)).resolves.toEqual([
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
    expect(values).toEqual([12]);
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

    await expect(getLatestSetCollectorSnapshotFromDb("12")).resolves.toEqual({
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

    await expect(getLatestSetCollectorSnapshotFromDb(12)).resolves.toEqual({
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
    await expect(getSetCollectorSummaryFromDb(12)).resolves.toBeNull();
    await expect(listSetCollectorSnapshotsFromDb(12)).resolves.toEqual([]);
    await expect(getLatestSetCollectorSnapshotFromDb(12)).resolves.toBeNull();
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("falls back cleanly when a DB row contains invalid progress counts", async () => {
    mockSql.mockResolvedValue([
      {
        id: "12",
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

    await expect(getSetCollectorSummaryFromDb(12)).resolves.toBeNull();
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

    await expect(getLatestSetCollectorSnapshotFromDb(12)).resolves.toBeNull();
  });
});
