jest.mock("server-only", () => ({}));

const getSetCollectorSummaryForDateFromDbMock = jest.fn();
const getSetCollectorSummaryFromDbMock = jest.fn();
const listSetCollectorSnapshotsFromDbMock = jest.fn();
const listSetCollectorSummariesFromDbMock = jest.fn();

jest.mock("@/lib/set-collector-db", () => ({
  getSetCollectorSummaryForDateFromDb: (...args: unknown[]) =>
    getSetCollectorSummaryForDateFromDbMock(...args),
  getSetCollectorSummaryFromDb: (...args: unknown[]) =>
    getSetCollectorSummaryFromDbMock(...args),
  listSetCollectorSnapshotsFromDb: (...args: unknown[]) =>
    listSetCollectorSnapshotsFromDbMock(...args),
  listSetCollectorSummariesFromDb: (...args: unknown[]) =>
    listSetCollectorSummariesFromDbMock(...args),
}));

import {
  getSetCollectorDetailHref,
  getSetCollectorPageData,
  getSetCollectorSummaryRow,
  listSetCollectorSnapshotRows,
  listSetCollectorSummaryRows,
} from "@/lib/set-collector-content";

beforeEach(() => {
  getSetCollectorSummaryForDateFromDbMock.mockReset();
  getSetCollectorSummaryFromDbMock.mockReset();
  listSetCollectorSnapshotsFromDbMock.mockReset();
  listSetCollectorSummariesFromDbMock.mockReset();

  getSetCollectorSummaryForDateFromDbMock.mockResolvedValue(null);
  getSetCollectorSummaryFromDbMock.mockResolvedValue(null);
  listSetCollectorSnapshotsFromDbMock.mockResolvedValue([]);
  listSetCollectorSummariesFromDbMock.mockResolvedValue([]);
});

describe("getSetCollectorDetailHref", () => {
  it("normalizes the slug-based detail route id", () => {
    expect(getSetCollectorDetailHref(" /1992 Courtside Draft Pix/ ")).toBe(
      "/cardattack/set-collector/1992-courtside-draft-pix",
    );
  });
});

describe("listSetCollectorSummaryRows", () => {
  it("returns the DB-backed landing rows", async () => {
    listSetCollectorSummariesFromDbMock.mockResolvedValue([
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

    await expect(listSetCollectorSummaryRows()).resolves.toEqual([
      expect.objectContaining({
        id: 12,
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
        percentComplete: 91.2,
      }),
    ]);
  });
});

describe("getSetCollectorSummaryRow", () => {
  it("normalizes the slug before delegating to the DB helper", async () => {
    getSetCollectorSummaryFromDbMock.mockResolvedValue({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
      completedSetPhotoPath: "/images/optimus/1991-92-upper-deck/hero.webp",
      rating: 9.5,
      cardsOwned: 456,
      totalCards: 500,
      cardsMissing: 44,
      percentComplete: 91.2,
      snapshotCount: 3,
      latestSnapshotDate: "2026-04-10",
    });

    await expect(
      getSetCollectorSummaryRow(" /1991 92 Upper Deck/ "),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 12,
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
      }),
    );

    expect(getSetCollectorSummaryFromDbMock).toHaveBeenCalledWith(
      "1991-92-upper-deck",
    );
  });

  it("uses the dated summary helper when a snapshot date is provided", async () => {
    getSetCollectorSummaryForDateFromDbMock.mockResolvedValue({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
      totalCards: 500,
      cardsOwned: 450,
      cardsMissing: 50,
      percentComplete: 90,
      tcdbTradeId: "1005001",
      snapshotCount: 3,
      latestSnapshotDate: "2026-04-10",
    });

    await expect(
      getSetCollectorSummaryRow(" /1991 92 Upper Deck/ ", "2026-04-01"),
    ).resolves.toEqual(
      expect.objectContaining({
        setSlug: "1991-92-upper-deck",
        cardsOwned: 450,
        percentComplete: 90,
      }),
    );

    expect(getSetCollectorSummaryForDateFromDbMock).toHaveBeenCalledWith(
      "1991-92-upper-deck",
      "2026-04-01",
    );
    expect(getSetCollectorSummaryFromDbMock).not.toHaveBeenCalled();
  });
});

describe("listSetCollectorSnapshotRows", () => {
  it("returns DB-backed snapshot rows for one set", async () => {
    listSetCollectorSnapshotsFromDbMock.mockResolvedValue([
      {
        id: 101,
        setId: 12,
        snapshotDate: "2026-04-01",
        cardsOwned: 450,
        totalCards: 500,
        cardsMissing: 50,
        percentComplete: 90,
      },
    ]);

    await expect(
      listSetCollectorSnapshotRows("1991-92-upper-deck"),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 101,
        setId: 12,
        percentComplete: 90,
      }),
    ]);

    expect(listSetCollectorSnapshotsFromDbMock).toHaveBeenCalledWith(
      "1991-92-upper-deck",
    );
  });
});

describe("getSetCollectorPageData", () => {
  it("combines the summary row with snapshot timeline rows", async () => {
    getSetCollectorSummaryFromDbMock.mockResolvedValue({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
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
    });
    listSetCollectorSnapshotsFromDbMock.mockResolvedValue([
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

    await expect(getSetCollectorPageData("1991-92-upper-deck")).resolves.toEqual({
      id: 12,
      setSlug: "1991-92-upper-deck",
      setName: "1991-92 Upper Deck",
      releaseYear: 1991,
      manufacturer: "Upper Deck",
      tcdbSetUrl: "https://www.tcdb.com/ViewSet.cfm/sid/2090/1991-92-Upper-Deck",
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
      snapshots: [
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
      ],
      latestSnapshot: {
        id: 102,
        setId: 12,
        snapshotDate: "2026-04-10",
        cardsOwned: 456,
        totalCards: 500,
        cardsMissing: 44,
        percentComplete: 91.2,
        tcdbTradeId: "960943",
      },
    });
  });

  it("returns null when the requested set does not exist", async () => {
    getSetCollectorSummaryFromDbMock.mockResolvedValue(null);
    listSetCollectorSnapshotsFromDbMock.mockResolvedValue([
      {
        id: 102,
        setId: 12,
        snapshotDate: "2026-04-10",
        cardsOwned: 456,
        totalCards: 500,
        cardsMissing: 44,
        percentComplete: 91.2,
      },
    ]);

    await expect(getSetCollectorPageData("1991-92-upper-deck")).resolves.toBeNull();
  });
});
