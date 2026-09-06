/** @jest-environment node */

jest.mock("server-only", () => ({}));
const mockSql = jest.fn();
jest.mock("@/lib/db", () => ({ sql: (strings: TemplateStringsArray, ...values: unknown[]) => mockSql(strings, values) }));

import { listTcdbTradePartnersFromDb } from "@/lib/tcdb-trade-partners-db";

describe("TCDb trade partner DB", () => {
  it("maps summary metrics and optional profile fields", async () => {
    mockSql.mockResolvedValue([{ trade_partner_id: "7", tcdb_username: " Collector ", name: "Pat", city_state: "Toronto, ON", country: "Canada", trade_count: "2", cards_sent: "8", cards_received: "12", total_cards_exchanged: "20", first_trade_date: "2026-01-01", latest_trade_date: "2026-02-01", hall_of_fame_count: "1" }]);
    await expect(listTcdbTradePartnersFromDb()).resolves.toEqual([{ id: 7, tcdbUsername: " Collector ", name: "Pat", cityState: "Toronto, ON", country: "Canada", tradeCount: 2, cardsSent: 8, cardsReceived: 12, totalCardsExchanged: 20, firstTradeDate: "2026-01-01", latestTradeDate: "2026-02-01", hallOfFameCount: 1 }]);
    expect(mockSql.mock.calls[0][0].join("")).toContain("dojo.v_tcdb_trade_partner_summary");
  });

  it("omits empty optional profile fields", async () => {
    mockSql.mockResolvedValue([{ trade_partner_id: 8, tcdb_username: "quiet", name: null, city_state: " ", country: null, trade_count: 1, cards_sent: 0, cards_received: 0, total_cards_exchanged: 0, first_trade_date: null, latest_trade_date: null, hall_of_fame_count: 0 }]);
    await expect(listTcdbTradePartnersFromDb()).resolves.toEqual([{ id: 8, tcdbUsername: "quiet", tradeCount: 1, cardsSent: 0, cardsReceived: 0, totalCardsExchanged: 0, hallOfFameCount: 0 }]);
  });
});
