import "server-only";

import { sql } from "@/lib/db";

export type TcdbTradeStatus = "Open" | "Completed";
export type TcdbTradeDaySide = "sent" | "received" | "archived";

type TcdbTradeCardCountsRow = {
  received: number | string | null;
  sent: number | string | null;
};

type TcdbTradeSummaryRow = TcdbTradeCardCountsRow & {
  trade_id: string;
  partner: string | null;
  start_date: string | null;
  end_date: string | null;
  section_count: number | string;
  has_completed: boolean;
};

type TcdbTradeDayRow = {
  trade_date: string;
  side: TcdbTradeDaySide;
};

export type TcdbTradeCardCounts = {
  received?: number;
  sent?: number;
  total?: number;
};

export type TcdbTradeDay = {
  tradeDate: string;
  side: TcdbTradeDaySide;
};

export type TcdbTradeSummary = TcdbTradeCardCounts & {
  tradeId: string;
  partner?: string;
  startDate: string;
  endDate?: string;
  sectionCount: number;
  status: TcdbTradeStatus;
};

export function normalizeTcdbTradeId(tradeId: string): string {
  const normalized = tradeId.trim();

  if (!normalized) {
    throw new Error("TCDb trade lookup: tradeId must be a non-empty string.");
  }

  return normalized;
}

function toInteger(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  return Number.parseInt(value, 10);
}

function toTradeCardCounts(
  received?: number,
  sent?: number,
): TcdbTradeCardCounts {
  const counts: TcdbTradeCardCounts = {};

  if (received !== undefined) {
    counts.received = received;
  }

  if (sent !== undefined) {
    counts.sent = sent;
  }

  if (received !== undefined || sent !== undefined) {
    counts.total = (received ?? 0) + (sent ?? 0);
  }

  return counts;
}

function toTcdbTradeSummary(row: TcdbTradeSummaryRow): TcdbTradeSummary {
  const received = row.received === null ? undefined : toInteger(row.received);
  const sent = row.sent === null ? undefined : toInteger(row.sent);

  return {
    ...toTradeCardCounts(received, sent),
    tradeId: row.trade_id,
    startDate: row.start_date ?? "",
    sectionCount: toInteger(row.section_count),
    status: row.has_completed ? "Completed" : "Open",
    ...(row.partner ? { partner: row.partner } : {}),
    ...(row.end_date ? { endDate: row.end_date } : {}),
  };
}

export async function getTcdbTradeSummaryFromDb(
  tradeId: string,
): Promise<TcdbTradeSummary | null> {
  const normalizedTradeId = normalizeTcdbTradeId(tradeId);

  const [row] = await sql<TcdbTradeSummaryRow>`
    SELECT
      trade.trade_id,
      trade.partner,
      TO_CHAR(MIN(day.trade_date), 'YYYY-MM-DD') AS start_date,
      TO_CHAR(
        MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')),
        'YYYY-MM-DD'
      ) AS end_date,
      COUNT(day.id) AS section_count,
      COALESCE(BOOL_OR(day.side IN ('received', 'archived')), FALSE) AS has_completed,
      trade.received AS received,
      trade.sent AS sent
    FROM dojo.tcdb_trade AS trade
    LEFT JOIN dojo.tcdb_trade_day AS day
      ON day.trade_id = trade.trade_id
    WHERE trade.trade_id = ${normalizedTradeId}
    GROUP BY trade.id, trade.trade_id, trade.partner, trade.received, trade.sent
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  return toTcdbTradeSummary(row);
}

export async function listTcdbTradesFromDb(): Promise<TcdbTradeSummary[]> {
  const rows = await sql<TcdbTradeSummaryRow>`
    SELECT
      trade.trade_id,
      trade.partner,
      TO_CHAR(MIN(day.trade_date), 'YYYY-MM-DD') AS start_date,
      TO_CHAR(
        MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')),
        'YYYY-MM-DD'
      ) AS end_date,
      COUNT(day.id) AS section_count,
      COALESCE(BOOL_OR(day.side IN ('received', 'archived')), FALSE) AS has_completed,
      trade.received AS received,
      trade.sent AS sent
    FROM dojo.tcdb_trade AS trade
    LEFT JOIN dojo.tcdb_trade_day AS day
      ON day.trade_id = trade.trade_id
    GROUP BY trade.id, trade.trade_id, trade.partner, trade.received, trade.sent
  `;

  return rows
    .map(toTcdbTradeSummary)
    .sort((a, b) => Number(b.tradeId) - Number(a.tradeId));
}

export async function listTcdbTradeDaysFromDb(
  tradeId: string,
): Promise<TcdbTradeDay[]> {
  const normalizedTradeId = normalizeTcdbTradeId(tradeId);

  const rows = await sql<TcdbTradeDayRow>`
    SELECT
      TO_CHAR(day.trade_date, 'YYYY-MM-DD') AS trade_date,
      day.side
    FROM dojo.tcdb_trade AS trade
    JOIN dojo.tcdb_trade_day AS day
      ON day.trade_id = trade.trade_id
    WHERE trade.trade_id = ${normalizedTradeId}
    ORDER BY day.trade_date ASC
  `;

  return rows.map((row) => ({
    tradeDate: row.trade_date,
    side: row.side,
  }));
}

export async function getTcdbTradeCardCountsFromDb(
  tradeId: string,
): Promise<TcdbTradeCardCounts> {
  const summary = await getTcdbTradeSummaryFromDb(tradeId);

  if (!summary) {
    return {};
  }

  return toTradeCardCounts(summary.received, summary.sent);
}

export async function countTcdbTradeSections(tradeId: string): Promise<number> {
  const summary = await getTcdbTradeSummaryFromDb(tradeId);
  return summary?.sectionCount ?? 0;
}

export async function hasCompletedTcdbTrade(tradeId: string): Promise<boolean> {
  const summary = await getTcdbTradeSummaryFromDb(tradeId);
  return summary?.status === "Completed";
}
