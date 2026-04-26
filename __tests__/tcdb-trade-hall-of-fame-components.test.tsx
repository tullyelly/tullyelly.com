import { render, screen, within } from "@testing-library/react";

jest.mock("@/lib/datetime", () => ({
  fmtDate: (value: string) => value,
}));

import TcdbTradeHallOfFameInductionsTable from "@/app/cardattack/tcdb-trades/_components/TcdbTradeHallOfFameInductionsTable";
import TcdbTradeHallOfFameTable from "@/app/cardattack/tcdb-trades/_components/TcdbTradeHallOfFameTable";

describe("TCDb Trade Hall of Fame components", () => {
  it("sorts Hall of Famers and renders profile links", () => {
    render(
      <TcdbTradeHallOfFameTable
        rows={[
          {
            partner: "jamestagli",
            categoryTags: ["baseball"],
            inductionCount: 1,
            latestInductedDate: "2026-03-26",
          },
          {
            partner: null,
            categoryTags: ["basketball"],
            inductionCount: 2,
            latestInductedDate: "2026-01-31",
          },
          {
            partner: "collect-a-set",
            categoryTags: ["basketball", "football"],
            inductionCount: 2,
            latestInductedDate: "2026-04-10",
          },
        ]}
      />,
    );

    const rows = screen.getAllByTestId("tcdb-trade-hof-row");
    expect(within(rows[0]).getByText("collect-a-set")).toBeInTheDocument();
    expect(
      within(rows[0]).getByText("(basketball, football)"),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("Unknown")).toBeInTheDocument();
    expect(within(rows[1]).getByText("(basketball)")).toBeInTheDocument();
    expect(within(rows[2]).getByText("jamestagli")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "collect-a-set" })[0],
    ).toHaveAttribute(
      "href",
      "https://www.tcdb.com/Profile.cfm/collect-a-set",
    );
    expect(within(rows[0]).getByText("2")).toHaveClass("tabular-nums");
  });

  it("sorts inductions and renders set, trade, and Hall of Famer links", () => {
    render(
      <TcdbTradeHallOfFameInductionsTable
        rows={[
          {
            setSlug: "1991-92-upper-deck",
            setHref: "/cardattack/set-collector/1991-92-upper-deck",
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
            setHref: "/cardattack/set-collector/1992-courtside-draft-pix",
            setName: "1992 Courtside Draft Pix",
            releaseYear: 1992,
            manufacturer: "Courtside",
            categoryTag: "basketball",
            tradeId: "1004001",
            partner: null,
            inductedDate: "2026-04-10",
            cardsOwned: 147,
            totalCards: 147,
          },
        ]}
      />,
    );

    const rows = screen.getAllByTestId("tcdb-trade-hof-induction-row");
    expect(
      within(rows[0]).getByText("1992 Courtside Draft Pix"),
    ).toBeInTheDocument();
    expect(within(rows[0]).getByText("basketball")).toBeInTheDocument();
    expect(screen.queryByText("1992 Courtside")).not.toBeInTheDocument();
    expect(screen.queryByText("1991 Upper Deck")).not.toBeInTheDocument();
    expect(within(rows[1]).getByText("1991-92 Upper Deck")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "1992 Courtside Draft Pix" })[0],
    ).toHaveAttribute(
      "href",
      "/cardattack/set-collector/1992-courtside-draft-pix",
    );
    expect(screen.getAllByRole("link", { name: "1004001" })[0]).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trades/1004001",
    );
    expect(
      screen.getAllByRole("link", { name: "collect-a-set" })[0],
    ).toHaveAttribute(
      "href",
      "https://www.tcdb.com/Profile.cfm/collect-a-set",
    );
    expect(within(rows[0]).getByText("Unknown")).toBeInTheDocument();
  });
});
