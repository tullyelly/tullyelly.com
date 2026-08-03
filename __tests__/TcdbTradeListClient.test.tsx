import { fireEvent, render, screen, within } from "@testing-library/react";

import TcdbTradeListClient from "@/app/cardattack/tcdb-trades/_components/TcdbTradeListClient";

const rows = [
  {
    tradeId: "200",
    startDate: "2026-01-02",
    received: 2,
    sent: 1,
    total: 3,
    partner: "BuckCollector",
    status: "Open" as const,
  },
  {
    tradeId: "100",
    startDate: "2025-12-01",
    endDate: "2025-12-10",
    received: 4,
    sent: 4,
    total: 8,
    partner: "CardFriend",
    status: "Completed" as const,
  },
];

describe("TcdbTradeListClient", () => {
  it("filters the mobile cards and desktop table with the standard table search", () => {
    render(<TcdbTradeListClient rows={rows} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search TCDb trades" }),
      { target: { value: "cardfriend" } },
    );

    const table = screen.getByRole("table", { name: "TCDB trades table" });
    expect(within(table).getByText("100")).toBeInTheDocument();
    expect(within(table).queryByText("200")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("tcdb-trade-card")).toHaveLength(1);
    expect(screen.getByText("1 TCDb trade shown")).toBeInTheDocument();
  });

  it("matches numeric and status columns case-insensitively", () => {
    render(<TcdbTradeListClient rows={rows} />);
    const search = screen.getByRole("searchbox", {
      name: "Search TCDb trades",
    });

    fireEvent.change(search, { target: { value: "OPEN" } });
    expect(screen.getAllByTestId("tcdb-trade-row")).toHaveLength(1);

    fireEvent.change(search, { target: { value: "8" } });
    expect(screen.getAllByTestId("tcdb-trade-row")).toHaveLength(1);
    expect(
      within(screen.getByTestId("tcdb-trade-row")).getByText("100"),
    ).toBeInTheDocument();
  });
});
