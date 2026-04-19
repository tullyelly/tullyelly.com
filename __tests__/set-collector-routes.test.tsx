import { render, screen } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

const listSetCollectorSummaryRowsMock = jest.fn();
const getSetCollectorPageDataMock = jest.fn();
const notFoundMock = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

jest.mock("@/lib/set-collector-content", () => ({
  getSetCollectorPageData: (...args: unknown[]) =>
    getSetCollectorPageDataMock(...args),
  listSetCollectorSummaryRows: (...args: unknown[]) =>
    listSetCollectorSummaryRowsMock(...args),
}));

import CardattackSetCollectorIdPage, {
  generateMetadata as generateSetCollectorDetailMetadata,
} from "@/app/cardattack/set-collector/[id]/page";
import CardattackSetCollectorPage, {
  metadata as setCollectorLandingMetadata,
} from "@/app/cardattack/set-collector/page";

describe("set collector route pages", () => {
  beforeEach(() => {
    listSetCollectorSummaryRowsMock.mockReset();
    getSetCollectorPageDataMock.mockReset();
    notFoundMock.mockClear();
  });

  it("exports collection metadata for the landing route", () => {
    expect(setCollectorLandingMetadata.title).toBe(
      "Set Collector | cardattack vault",
    );
    expect(setCollectorLandingMetadata.alternates?.canonical).toBe(
      "https://tullyelly.com/cardattack/set-collector",
    );
    expect(setCollectorLandingMetadata.openGraph?.url).toBe(
      "/cardattack/set-collector",
    );
  });

  it("renders the landing route from DB-backed summary rows", async () => {
    listSetCollectorSummaryRowsMock.mockResolvedValue([
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

    const ui = await CardattackSetCollectorPage();
    render(ui);

    expect(listSetCollectorSummaryRowsMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Set Collector" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "1991-92 Upper Deck" })[0],
    ).toHaveAttribute("href", "/cardattack/set-collector/12");
  });

  it("builds detail metadata from DB-backed page data", async () => {
    getSetCollectorPageDataMock.mockResolvedValue({
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
      snapshots: [],
    });

    const metadata = await generateSetCollectorDetailMetadata({
      params: Promise.resolve({ id: "12" }),
    });

    expect(getSetCollectorPageDataMock).toHaveBeenCalledWith(12);
    expect(metadata.title).toBe("1991-92 Upper Deck | Set Collector");
    expect(metadata.description).toBe(
      "1991 Upper Deck 1991-92 Upper Deck. Set size: 500 cards. 456 of 500 cards; 91.2% complete. Latest snapshot: 2026-04-10.",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://tullyelly.com/cardattack/set-collector/12",
    );
    expect(metadata.openGraph?.url).toBe("/cardattack/set-collector/12");
  });

  it("uses defensive detail metadata when the route id is invalid", async () => {
    const metadata = await generateSetCollectorDetailMetadata({
      params: Promise.resolve({ id: "abc" }),
    });

    expect(metadata.title).toBe("Set Collector | cardattack vault");
    expect(metadata.description).toBe("Tracked card set abc detail page.");
    expect(getSetCollectorPageDataMock).not.toHaveBeenCalled();
  });

  it("renders the detail route from DB-backed page data", async () => {
    getSetCollectorPageDataMock.mockResolvedValue({
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
      snapshots: [
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
    });

    const ui = await CardattackSetCollectorIdPage({
      params: Promise.resolve({ id: "12" }),
    });
    render(ui);

    expect(getSetCollectorPageDataMock).toHaveBeenCalledWith(12);
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "← Back to Set Collector" }),
    ).toHaveAttribute("href", "/cardattack/set-collector");
    expect(
      screen.getByRole("link", { name: "960943" }),
    ).toHaveAttribute("href", "/cardattack/tcdb-trades/960943");
  });

  it("throws notFound for invalid route ids", async () => {
    await expect(
      CardattackSetCollectorIdPage({
        params: Promise.resolve({ id: "abc" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(getSetCollectorPageDataMock).not.toHaveBeenCalled();
  });

  it("throws notFound when a valid route id is missing from the DB", async () => {
    getSetCollectorPageDataMock.mockResolvedValue(null);

    await expect(
      CardattackSetCollectorIdPage({
        params: Promise.resolve({ id: "12" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getSetCollectorPageDataMock).toHaveBeenCalledWith(12);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
