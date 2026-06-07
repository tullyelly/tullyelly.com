import "server-only";

import { asDateString } from "@/lib/dates";
import { withDbRetry } from "@/lib/db/retry";
import { sqlQueryRows } from "@/lib/db-sql-helpers";
import { normalizeTagSlug } from "@/lib/tags";

export type ClanSnapshotTrend = "up" | "down" | "flat";

type DbClanSnapshotRow = {
  clan_id: string | number;
  name: string;
  slug: string;
  sport: string;
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
  trend_rank: ClanSnapshotTrend;
  trend_overall: ClanSnapshotTrend;
  diff_sign_changed: boolean;
};

export type ClanSnapshotRecord = {
  clanId: string;
  slug: string;
  sport: string;
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
  trend: ClanSnapshotTrend;
  trendRank: ClanSnapshotTrend;
  trendOverall: ClanSnapshotTrend;
  diffSignChanged: boolean;
};

const CLAN_SNAPSHOT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toInteger(value: number | string): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid integer value returned from clan snapshot query");
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

function normalizeSnapshotSlug(value: string): string | null {
  const normalized = normalizeTagSlug(value);
  return CLAN_SNAPSHOT_SLUG_PATTERN.test(normalized) ? normalized : null;
}

function toClanSnapshotRecord(row: DbClanSnapshotRow): ClanSnapshotRecord {
  const rankingAt = asDateString(row.ranking_at);

  if (!rankingAt) {
    throw new Error("Invalid ranking_at value returned from clan snapshot query");
  }

  const prevCardCount = toOptionalInteger(row.prev_card_count);
  const prevRanking = toOptionalInteger(row.prev_ranking);
  const prevDifference = toOptionalInteger(row.prev_difference);
  const prevRankingAt = asDateString(row.prev_ranking_at);
  const cardCountDelta = toOptionalInteger(row.card_count_delta);
  const rankDelta = toOptionalInteger(row.rank_delta);
  const diffDelta = toOptionalInteger(row.diff_delta);

  return {
    clanId: String(row.clan_id),
    slug: row.slug,
    sport: row.sport,
    displayName: row.name,
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

export async function getClanSnapshotsForTagOnDate(
  tag: string,
  snapshotDate: string,
  sport?: string,
): Promise<ClanSnapshotRecord[]> {
  const normalizedDate = asDateString(snapshotDate);
  const normalizedTag = normalizeSnapshotSlug(tag);
  const normalizedSport = sport ? normalizeSnapshotSlug(sport) : undefined;

  if (
    !normalizedTag ||
    !normalizedDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) ||
    (sport && !normalizedSport)
  ) {
    return [];
  }

  const values: string[] = [normalizedDate, normalizedTag];
  const sportFilter = normalizedSport ? "AND s.sport = $3" : "";

  if (normalizedSport) {
    values.push(normalizedSport);
  }

  const rows = await withDbRetry(() =>
    sqlQueryRows<DbClanSnapshotRow>(
      `
        WITH matched_clans AS (
          SELECT
            c.id::text AS clan_id,
            CASE WHEN to_jsonb(c) ->> 'tag_slug' = $2 THEN 0 ELSE 1 END AS match_rank
          FROM dojo.clan AS c
          WHERE to_jsonb(c) ->> 'tag_slug' = $2
             OR c.slug = $2
        ),
        snapshot_history AS (
          SELECT
            c.match_rank,
            snapshot.clan_id::text AS clan_id,
            clan.name,
            clan.slug,
            snapshot.sport,
            snapshot.card_count,
            snapshot.ranking,
            snapshot.ranking_at,
            snapshot.difference,
            LAG(snapshot.card_count) OVER (
              PARTITION BY snapshot.clan_id, snapshot.sport
              ORDER BY snapshot.ranking_at
            ) AS prev_card_count,
            LAG(snapshot.ranking) OVER (
              PARTITION BY snapshot.clan_id, snapshot.sport
              ORDER BY snapshot.ranking_at
            ) AS prev_ranking,
            LAG(snapshot.difference) OVER (
              PARTITION BY snapshot.clan_id, snapshot.sport
              ORDER BY snapshot.ranking_at
            ) AS prev_difference,
            LAG(snapshot.ranking_at) OVER (
              PARTITION BY snapshot.clan_id, snapshot.sport
              ORDER BY snapshot.ranking_at
            ) AS prev_ranking_at
          FROM dojo.clan_tcdb_snapshot AS snapshot
          JOIN dojo.clan AS clan
            ON clan.id = snapshot.clan_id
          JOIN matched_clans AS c
            ON c.clan_id = snapshot.clan_id::text
        )
        SELECT
          s.clan_id,
          s.name,
          s.slug,
          s.sport,
          s.card_count,
          s.ranking,
          s.ranking_at::text AS ranking_at,
          s.prev_card_count,
          s.prev_ranking,
          s.prev_difference,
          s.prev_ranking_at::text AS prev_ranking_at,
          (s.card_count - s.prev_card_count) AS card_count_delta,
          (s.prev_ranking - s.ranking) AS rank_delta,
          (s.difference - s.prev_difference) AS diff_delta,
          CASE
            WHEN s.prev_ranking IS NULL THEN 'flat'
            WHEN (s.prev_ranking - s.ranking) > 0 THEN 'up'
            WHEN (s.prev_ranking - s.ranking) < 0 THEN 'down'
            ELSE 'flat'
          END AS trend_rank,
          CASE
            WHEN s.prev_ranking IS NULL THEN 'flat'
            WHEN (s.prev_ranking - s.ranking) <> 0 THEN
              CASE WHEN (s.prev_ranking - s.ranking) > 0 THEN 'up' ELSE 'down' END
            WHEN (s.difference - s.prev_difference) IS NOT NULL
              AND (s.difference - s.prev_difference) <> 0 THEN
              CASE WHEN (s.difference - s.prev_difference) > 0 THEN 'up' ELSE 'down' END
            ELSE 'flat'
          END AS trend_overall,
          CASE
            WHEN s.prev_difference IS NULL THEN FALSE
            WHEN (s.prev_difference < 0 AND s.difference >= 0)
              OR (s.prev_difference >= 0 AND s.difference < 0)
            THEN TRUE
            ELSE FALSE
          END AS diff_sign_changed
        FROM snapshot_history AS s
        WHERE s.ranking_at = $1::date
        ${sportFilter}
        ORDER BY s.match_rank ASC, s.sport ASC, s.ranking ASC, s.slug ASC
      `,
      values,
    ),
  );

  return rows.map(toClanSnapshotRecord);
}
