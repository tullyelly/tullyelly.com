import { render, screen } from "@testing-library/react";

jest.mock("@/lib/tcdb-trade-partners-db", () => ({
  listTcdbTradePartnersFromDb: jest.fn(async () => [
    {
      id: 1,
      tcdbUsername: "collector",
      name: "Pat",
      cityState: "London",
      country: "UK",
      tradeCount: 2,
      cardsSent: 3,
      cardsReceived: 4,
      totalCardsExchanged: 7,
      latestTradeDate: "2026-02-01",
      hallOfFameCount: 1,
    },
  ]),
  getTcdbTradePartnerFromDb: jest.fn(async () => ({
    id: 1,
    tcdbUsername: "collector",
    tradeCount: 1,
    cardsSent: 2,
    cardsReceived: 3,
    totalCardsExchanged: 5,
    hallOfFameCount: 0,
  })),
  listTcdbTradesForPartnerFromDb: jest.fn(async () => [
    {
      tradeId: "123",
      tradePartnerId: 1,
      partner: "collector",
      startDate: "2026-01-01",
      sectionCount: 1,
      status: "Completed",
      sent: 2,
      received: 3,
      total: 5,
    },
  ]),
  listHomiesForTradePartnerFromDb: jest.fn(async () => []),
  listClansForTradePartnerFromDb: jest.fn(async () => []),
  listTagsForTradePartnerFromDb: jest.fn(async () => []),
  listContentTagsForTradePartnerFromDb: jest.fn(async () => []),
  listSetCollectorImpactForTradePartnerFromDb: jest.fn(async () => []),
}));
jest.mock("@/lib/tcdb-trade-partner-content", () => ({
  getRelatedTradePartnerChronicles: () => [],
}));
jest.mock("@/lib/tcdb-trades", () => ({
  getTcdbProfileUrl: (username: string) =>
    `https://www.tcdb.com/Profile.cfm/${username}`,
}));

import PartnerDetailPage from "@/app/cardattack/tcdb-trade-partners/[id]/page";
import PartnerListPage from "@/app/cardattack/tcdb-trade-partners/page";

describe("TCDb trade partner pages", () => {
  it("renders partner summary metrics on the list", async () => {
    render(await PartnerListPage());
    expect(screen.getByRole("link", { name: "collector" })).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trade-partners/1",
    );
    expect(screen.getByText("Pat")).toBeInTheDocument();
    expect(screen.getByText("London; UK")).toBeInTheDocument();
  });

  it("renders detail without empty optional relationship sections", async () => {
    render(await PartnerDetailPage({ params: Promise.resolve({ id: "1" }) }));
    expect(
      screen.getByRole("heading", { name: "collector" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "View collector on TCDb (external site)",
      }),
    ).toHaveAttribute("href", "https://www.tcdb.com/Profile.cfm/collector");
    expect(screen.getByRole("link", { name: "Trade 123" })).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trades/123",
    );
    expect(
      screen.queryByRole("heading", { name: "Interests" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Related Chronicles" }),
    ).not.toBeInTheDocument();
  });
});
