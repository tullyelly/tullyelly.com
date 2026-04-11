import "server-only";

import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryOne } from "@/lib/db-sql-helpers";
import { normalizeTagSlug } from "@/lib/tags";

export type TcdbSnapshotTrend = "up" | "down" | "flat";

type DbTcdbSnapshotRow = {
  homie_id: string | number;
  name: string;
  card_count: number | string;
  ranking: number | string;
  ranking_at: string;
  prev_card_count: number | string | null;
  prev_ranking: number | string | null;
  prev_difference: number | string | null;
  prev_ranking_at: string | null;
  card_count_delta: number | string | null;
  rank_delta: number | string | null;
  diff_delta: number | string | null;
  trend_rank: TcdbSnapshotTrend;
  trend_overall: TcdbSnapshotTrend;
  diff_sign_changed: boolean;
};

export type TcdbSnapshotRecord = {
  homieId: string;
  displayName: string;
  cardCount: number;
  ranking: number;
  rankingAt: string;
  prevCardCount?: number;
  prevRanking?: number;
  prevDifference?: number;
  prevRankingAt?: string;
  cardCountDelta?: number;
  rankDelta?: number;
  diffDelta?: number;
  trend: TcdbSnapshotTrend;
  trendRank: TcdbSnapshotTrend;
  trendOverall: TcdbSnapshotTrend;
  diffSignChanged: boolean;
};

function toInteger(value: number | string): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid integer value returned from TCDB snapshot query");
  }

  return parsed;
}

function toOptionalInteger(
  value: number | string | null | undefined,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return toInteger(value);
}


export async function getTcdbSnapshotForTagOnDate(
  tag: string,
  snapshotDate: string,
): Promise<TcdbSnapshotRecord | null> {
  const normalizedDate = asDateString(snapshotDate);
  const normalizedTag = normalizeTagSlug(tag);

  if (!normalizedTag || !normalizedDate || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return null;
  }

  const row = await withDbRetry(() =>
    sqlQueryOne<DbTcdbSnapshotRow>(
      `
        WITH matched_homie AS (
          SELECT
            h.id::text AS homie_id
          FROM dojo.homie AS h
          WHERE h.tag_slug = $2
          ORDER BY h.id ASC
          LIMIT 1
        )
        SELECT
          s.homie_id::text AS homie_id,
          s.name,
          s.card_count,
          s.ranking,
          s.ranking_at::text AS ranking_at,
          s.prev_card_count,
          s.prev_ranking,
          s.prev_difference,
          s.prev_ranking_at::text AS prev_ranking_at,
          s.card_count_delta,
          s.rank_delta,
          s.diff_delta,
          s.trend_rank,
          s.trend_overall,
          s.diff_sign_changed
        FROM dojo.homie_tcdb_snapshot_rt AS s
        JOIN matched_homie AS h
          ON h.homie_id = s.homie_id::text
        WHERE s.ranking_at = $1::date
        LIMIT 1
      `,
      [normalizedDate, normalizedTag],
    ),
  );

  if (!row) {
    return null;
  }

  const rankingAt = asDateString(row.ranking_at);

  if (!rankingAt) {
    throw new Error("Invalid ranking_at value returned from TCDB snapshot query");
  }

  const prevCardCount = toOptionalInteger(row.prev_card_count);
  const prevRanking = toOptionalInteger(row.prev_ranking);
  const prevDifference = toOptionalInteger(row.prev_difference);
  const prevRankingAt = asDateString(row.prev_ranking_at);
  const cardCountDelta = toOptionalInteger(row.card_count_delta);
  const rankDelta = toOptionalInteger(row.rank_delta);
  const diffDelta = toOptionalInteger(row.diff_delta);

  return {
    homieId: String(row.homie_id),
    displayName: row.name.toLowerCase(),
    cardCount: toInteger(row.card_count),
    ranking: toInteger(row.ranking),
    rankingAt,
    ...(prevCardCount !== undefined ? { prevCardCount } : {}),
    ...(prevRanking !== undefined ? { prevRanking } : {}),
    ...(prevDifference !== undefined ? { prevDifference } : {}),
    ...(prevRankingAt ? { prevRankingAt } : {}),
    ...(cardCountDelta !== undefined ? { cardCountDelta } : {}),
    ...(rankDelta !== undefined ? { rankDelta } : {}),
    ...(diffDelta !== undefined ? { diffDelta } : {}),
    trend: row.trend_rank,
    trendRank: row.trend_rank,
    trendOverall: row.trend_overall,
    diffSignChanged: row.diff_sign_changed,
  };
}
