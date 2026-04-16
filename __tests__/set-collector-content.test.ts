jest.mock("server-only", () => ({}));

const getSetCollectorSummaryFromDbMock = jest.fn();
const listSetCollectorSnapshotsFromDbMock = jest.fn();
const listSetCollectorSummariesFromDbMock = jest.fn();

jest.mock("@/lib/set-collector-db", () => ({
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
  getSetCollectorSummaryFromDbMock.mockReset();
  listSetCollectorSnapshotsFromDbMock.mockReset();
  listSetCollectorSummariesFromDbMock.mockReset();

  getSetCollectorSummaryFromDbMock.mockResolvedValue(null);
  listSetCollectorSnapshotsFromDbMock.mockResolvedValue([]);
  listSetCollectorSummariesFromDbMock.mockResolvedValue([]);
});

describe("getSetCollectorDetailHref", () => {
  it("normalizes the numeric detail route id", () => {
    expect(getSetCollectorDetailHref(" 12 ")).toBe(
      "/cardattack/set-collector/12",
    );
  });
});

describe("listSetCollectorSummaryRows", () => {
  it("returns the DB-backed landing rows", async () => {
    listSetCollectorSummariesFromDbMock.mockResolvedValue([
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

    await expect(listSetCollectorSummaryRows()).resolves.toEqual([
      expect.objectContaining({
        id: 12,
        setName: "1991-92 Upper Deck",
        percentComplete: 91.2,
      }),
    ]);
  });
});

describe("getSetCollectorSummaryRow", () => {
  it("normalizes the id before delegating to the DB helper", async () => {
    getSetCollectorSummaryFromDbMock.mockResolvedValue({
      id: 12,
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

    await expect(getSetCollectorSummaryRow(" 12 ")).resolves.toEqual(
      expect.objectContaining({
        id: 12,
        setName: "1991-92 Upper Deck",
      }),
    );

    expect(getSetCollectorSummaryFromDbMock).toHaveBeenCalledWith(12);
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

    await expect(listSetCollectorSnapshotRows(12)).resolves.toEqual([
      expect.objectContaining({
        id: 101,
        setId: 12,
        percentComplete: 90,
      }),
    ]);

    expect(listSetCollectorSnapshotsFromDbMock).toHaveBeenCalledWith(12);
  });
});

describe("getSetCollectorPageData", () => {
  it("combines the summary row with snapshot timeline rows", async () => {
    getSetCollectorSummaryFromDbMock.mockResolvedValue({
      id: 12,
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

    await expect(getSetCollectorPageData("12")).resolves.toEqual({
      id: 12,
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

    await expect(getSetCollectorPageData(12)).resolves.toBeNull();
  });
});
