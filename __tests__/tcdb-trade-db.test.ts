/** @jest-environment node */

import { readFileSync } from "fs";

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  countTcdbTradeSections,
  getTcdbTradeCardCountsFromDb,
  getTcdbCardTrafficChartRowsForChronicleFromDb,
  getTcdbTradeSummaryFromDb,
  hasCompletedTcdbTrade,
  listTcdbCardTrafficDaysForChronicleFromDb,
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

  it("lists 10-day card traffic rows and fills missing dates with zero", async () => {
    mockSql.mockResolvedValue([
      {
        traffic_date: "2026-06-24",
        trade_count: "2",
        card_total: "9",
      },
    ]);

    const rows = await listTcdbCardTrafficDaysForChronicleFromDb(
      "2026-06-25",
      "2026-06-29",
    );

    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({
      date: "2026-06-20",
      slot: 1,
      cardTotal: 0,
      tradeCount: 0,
      isChronicleDate: false,
    });
    expect(rows[4]).toMatchObject({
      date: "2026-06-24",
      slot: 5,
      cardTotal: 9,
      tradeCount: 2,
      isChronicleDate: false,
    });
    expect(rows[5]).toMatchObject({
      date: "2026-06-25",
      slot: 6,
      cardTotal: 0,
      tradeCount: 0,
      isChronicleDate: true,
    });
    expect(rows[9]).toMatchObject({
      date: "2026-06-29",
      slot: 10,
      cardTotal: 0,
      tradeCount: 0,
      isChronicleDate: false,
    });

    const [strings, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    const queryText = strings.join("");
    expect(queryText).toContain("FROM dojo.v_tcdb_trade_card_traffic_day");
    expect(queryText).toContain("traffic_date BETWEEN ");
    expect(values).toEqual(["2026-06-20", "2026-06-29"]);
  });

  it("hides chronicle card traffic before the oldest traffic date", async () => {
    mockSql.mockResolvedValue([
      {
        oldest_traffic_date: "2026-01-24",
      },
    ]);

    await expect(
      getTcdbCardTrafficChartRowsForChronicleFromDb("2026-01-23", "2026-06-29"),
    ).resolves.toBeNull();

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [strings] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    const queryText = strings.join("");
    expect(queryText).toContain("MIN(traffic_date)");
    expect(queryText).toContain("FROM dojo.v_tcdb_trade_card_traffic_trade");
  });

  it("shows chronicle card traffic starting on the oldest traffic date", async () => {
    mockSql
      .mockResolvedValueOnce([
        {
          oldest_traffic_date: "2026-01-24",
        },
      ])
      .mockResolvedValueOnce([
        {
          traffic_date: "2026-01-24",
          trade_count: "1",
          card_total: "8",
        },
      ]);

    const rows = await getTcdbCardTrafficChartRowsForChronicleFromDb(
      "2026-01-24",
      "2026-06-29",
    );

    expect(rows).toHaveLength(10);
    expect(rows?.[5]).toMatchObject({
      date: "2026-01-24",
      slot: 6,
      cardTotal: 8,
      tradeCount: 1,
      isChronicleDate: true,
    });
    expect(mockSql).toHaveBeenCalledTimes(2);
  });

  it("defines canonical trade card traffic views with side priority", () => {
    const migration = readFileSync(
      "db/migrations/055_create_tcdb_trade_card_traffic_views.sql",
      "utf8",
    );
    const tradeView = readFileSync(
      "db/schema/views/v_tcdb_trade_card_traffic_trade.sql",
      "utf8",
    );
    const dayView = readFileSync(
      "db/schema/views/v_tcdb_trade_card_traffic_day.sql",
      "utf8",
    );

    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_trade",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_day",
    );
    expect(tradeView).toContain(
      "MIN(day.trade_date) FILTER (WHERE day.side = 'sent') AS first_sent_date",
    );
    expect(tradeView).toContain(
      "MIN(day.trade_date) FILTER (WHERE day.side = 'received') AS first_received_date",
    );
    expect(tradeView).toContain(
      "MIN(day.trade_date) FILTER (WHERE day.side = 'archived') AS first_archived_date",
    );
    expect(tradeView).toContain("trade_dates.first_sent_date,");
    expect(tradeView).toContain("trade_dates.first_received_date,");
    expect(tradeView).toContain("trade_dates.first_archived_date");
    expect(tradeView).toContain(
      "COALESCE(trade.sent, 0) + COALESCE(trade.received, 0) AS card_total",
    );
    expect(tradeView).toContain(
      "WHEN trade_dates.first_sent_date IS NOT NULL THEN 'sent'",
    );
    expect(tradeView).toContain(
      "WHEN trade_dates.first_received_date IS NOT NULL THEN 'received'",
    );
    expect(tradeView).toContain(
      "WHEN trade_dates.first_archived_date IS NOT NULL THEN 'archived'",
    );
    expect(dayView).toContain(
      "FROM dojo.v_tcdb_trade_card_traffic_trade AS traffic",
    );
    expect(dayView).toContain("COUNT(*) AS trade_count");
    expect(dayView).toContain("SUM(traffic.card_total) AS card_total");
  });
});
