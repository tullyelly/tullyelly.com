import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

const listTcdbTradesMock = jest.fn();
const listTcdbTradeHallOfFamersMock = jest.fn();
const listTcdbTradeHallOfFameInductionsMock = jest.fn();

jest.mock("@/lib/tcdb-trades", () => ({
  listTcdbTrades: (...args: unknown[]) => listTcdbTradesMock(...args),
}));

jest.mock("@/lib/tcdb-trade-hall-of-fame", () => ({
  listTcdbTradeHallOfFamers: (...args: unknown[]) =>
    listTcdbTradeHallOfFamersMock(...args),
  listTcdbTradeHallOfFameInductions: (...args: unknown[]) =>
    listTcdbTradeHallOfFameInductionsMock(...args),
}));

jest.mock("@/lib/set-collector-content", () => ({
  getSetCollectorDetailHref: (slug: string) =>
    `/cardattack/set-collector/${encodeURIComponent(slug)}`,
}));

import Page, {
  dynamic,
  revalidate,
} from "@/app/cardattack/tcdb-trades/page";

describe("TCDb trades route Hall of Fame integration", () => {
  beforeEach(() => {
    listTcdbTradesMock.mockReset();
    listTcdbTradeHallOfFamersMock.mockReset();
    listTcdbTradeHallOfFameInductionsMock.mockReset();
  });

  it("keeps the route dynamic behavior", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  it("renders Hall of Fame sections above the existing trade list", async () => {
    listTcdbTradesMock.mockResolvedValue([
      {
        tradeId: "960943",
        startDate: "2026-01-24",
        endDate: "2026-01-31",
        partner: "collect-a-set",
        status: "Completed",
        received: 5,
        sent: 3,
        total: 8,
      },
    ]);
    listTcdbTradeHallOfFamersMock.mockResolvedValue([
      {
        partner: "collect-a-set",
        categoryTags: ["basketball", "football"],
        inductionCount: 2,
        latestInductedDate: "2026-04-10",
      },
    ]);
    listTcdbTradeHallOfFameInductionsMock.mockResolvedValue([
      {
        setSlug: "1991-92-upper-deck",
        setName: "1991-92 Upper Deck",
        releaseYear: 1991,
        manufacturer: "Upper Deck",
        categoryTag: "basketball",
        tradeId: "960943",
        partner: "collect-a-set",
        inductedDate: "2026-01-31",
        cardsOwned: 500,
        totalCards: 500,
      },
      {
        setSlug: "1992-courtside-draft-pix",
        setName: "1992 Courtside Draft Pix",
        releaseYear: 1992,
        manufacturer: "Courtside",
        categoryTag: "football",
        tradeId: "1004001",
        partner: "collect-a-set",
        inductedDate: "2026-04-10",
        cardsOwned: 147,
        totalCards: 147,
      },
    ]);

    const ui = await Page();
    render(ui);

    expect(listTcdbTradesMock).toHaveBeenCalledTimes(1);
    expect(listTcdbTradeHallOfFamersMock).toHaveBeenCalledTimes(1);
    expect(listTcdbTradeHallOfFameInductionsMock).toHaveBeenCalledTimes(1);

    const pageIntro = screen.getAllByRole("heading", {
      name: "TCDb Trades",
    })[0];
    const hallOfFameHeading = screen.getByRole("heading", {
      name: "TCDb Trade Hall of Fame",
    });
    const inductionsHeading = screen.getByRole("heading", {
      name: "Hall of Fame Inductions",
    });
    const tradeListHeading = screen.getAllByRole("heading", {
      name: "TCDb Trades",
    })[1];

    expect(pageIntro.compareDocumentPosition(hallOfFameHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(hallOfFameHeading.compareDocumentPosition(inductionsHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(inductionsHeading.compareDocumentPosition(tradeListHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(screen.getAllByText("Hall of Famer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inductions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(basketball, football)").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByTestId("tcdb-trade-table")).toBeInTheDocument();
    expect(screen.getByTestId("tcdb-trade-hof-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("tcdb-trade-hof-inductions-table"),
    ).toBeInTheDocument();
  });
});
