import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

const listTcdbTradeHallOfFamersMock = jest.fn();
const listTcdbTradeHallOfFameInductionsMock = jest.fn();

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
} from "@/app/cardattack/hof/page";

describe("TCDb Trade Hall of Fame route", () => {
  beforeEach(() => {
    listTcdbTradeHallOfFamersMock.mockReset();
    listTcdbTradeHallOfFameInductionsMock.mockReset();
  });

  it("keeps the route dynamic behavior", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  it("renders both Hall of Fame sections", async () => {
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

    expect(listTcdbTradeHallOfFamersMock).toHaveBeenCalledTimes(1);
    expect(listTcdbTradeHallOfFameInductionsMock).toHaveBeenCalledTimes(1);

    const hallOfFameHeadings = screen.getAllByRole("heading", {
      name: "TCDb Trade Hall of Fame",
    });
    const [pageIntro, hallOfFameHeading] = hallOfFameHeadings;
    const inductionsHeading = screen.getByRole("heading", {
      name: "Hall of Fame Inductions",
    });

    expect(pageIntro.compareDocumentPosition(hallOfFameHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(hallOfFameHeading.compareDocumentPosition(inductionsHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(screen.getAllByText("Hall of Famer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inductions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(basketball, football)").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByTestId("tcdb-trade-hof-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("tcdb-trade-hof-inductions-table"),
    ).toBeInTheDocument();
  });
});
