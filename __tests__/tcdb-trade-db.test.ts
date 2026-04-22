/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  countTcdbTradeSections,
  getTcdbTradeCardCountsFromDb,
  getTcdbTradeSummaryFromDb,
  hasCompletedTcdbTrade,
  listTcdbTradeDaysFromDb,
  listTcdbTradesFromDb,
  normalizeTcdbTradeId,
} from "@/lib/tcdb-trade-db";

describe("tcdb trade db helper", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("rejects blank trade ids", () => {
    expect(() => normalizeTcdbTradeId("   ")).toThrow(
      "TCDb trade lookup: tradeId must be a non-empty string.",
    );
  });

  it("returns a DB-backed trade summary", async () => {
    mockSql.mockResolvedValue([
      {
        trade_id: "960943",
        partner: "Jeff Skinner",
        start_date: "2026-01-24",
        end_date: "2026-01-31",
        section_count: "2",
        has_completed: true,
        received: "5",
        sent: "3",
      },
    ]);

    await expect(getTcdbTradeSummaryFromDb(" 960943 ")).resolves.toEqual({
      tradeId: "960943",
      partner: "Jeff Skinner",
      startDate: "2026-01-24",
      endDate: "2026-01-31",
      sectionCount: 2,
      status: "Completed",
      received: 5,
      sent: 3,
      total: 8,
    });

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [strings, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(strings.join("")).toContain("day.side IN ('received', 'archived')");
    expect(values).toEqual(["960943"]);
  });

  it("returns ordered DB-backed trade-day sides", async () => {
    mockSql.mockResolvedValue([
      { trade_date: "2026-01-24", side: "sent" },
      { trade_date: "2026-01-31", side: "received" },
      { trade_date: "2026-02-07", side: "archived" },
    ]);

    await expect(listTcdbTradeDaysFromDb("960943")).resolves.toEqual([
      { tradeDate: "2026-01-24", side: "sent" },
      { tradeDate: "2026-01-31", side: "received" },
      { tradeDate: "2026-02-07", side: "archived" },
    ]);
  });

  it("lists trade summaries sorted by numeric trade id descending", async () => {
    mockSql.mockResolvedValue([
      {
        trade_id: "960943",
        partner: "Jeff Skinner",
        start_date: "2026-01-24",
        end_date: "2026-01-31",
        section_count: "2",
        has_completed: true,
        received: "5",
        sent: "3",
      },
      {
        trade_id: "1001130",
        partner: "jamestagli",
        start_date: "2026-03-26",
        end_date: null,
        section_count: "1",
        has_completed: false,
        received: null,
        sent: null,
      },
    ]);

    await expect(listTcdbTradesFromDb()).resolves.toEqual([
      {
        tradeId: "1001130",
        partner: "jamestagli",
        startDate: "2026-03-26",
        sectionCount: 1,
        status: "Open",
      },
      {
        tradeId: "960943",
        partner: "Jeff Skinner",
        startDate: "2026-01-24",
        endDate: "2026-01-31",
        sectionCount: 2,
        status: "Completed",
        received: 5,
        sent: 3,
        total: 8,
      },
    ]);
  });

  it("derives counts and completed state from the trade summary query", async () => {
    mockSql
      .mockResolvedValueOnce([
        {
          trade_id: "960943",
          partner: "Jeff Skinner",
          start_date: "2026-01-24",
          end_date: "2026-01-31",
          section_count: "2",
          has_completed: true,
          received: "5",
          sent: "3",
        },
      ])
      .mockResolvedValueOnce([
        {
          trade_id: "960943",
          partner: "Jeff Skinner",
          start_date: "2026-01-24",
          end_date: "2026-01-31",
          section_count: "2",
          has_completed: true,
          received: "5",
          sent: "3",
        },
      ])
      .mockResolvedValueOnce([
        {
          trade_id: "960943",
          partner: "Jeff Skinner",
          start_date: "2026-01-24",
          end_date: "2026-01-31",
          section_count: "2",
          has_completed: true,
          received: "5",
          sent: "3",
        },
      ]);

    await expect(getTcdbTradeCardCountsFromDb("960943")).resolves.toEqual({
      received: 5,
      sent: 3,
      total: 8,
    });
    await expect(countTcdbTradeSections("960943")).resolves.toBe(2);
    await expect(hasCompletedTcdbTrade("960943")).resolves.toBe(true);
  });
});
