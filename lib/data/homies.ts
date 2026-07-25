import "server-only";

import { asDateString } from "@/lib/dates";
import { queryRows } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import type { Trend } from "@/lib/data/tcdb";

export type HomieDirectoryRow = {
  id: number;
  name: string;
  tag_slug: string | null;
  drafted: number;
  updated_at: string | null;
  route_slug: string;
  card_count: number | null;
  ranking: number | null;
  ranking_at: string | null;
  difference: number | null;
  rank_delta: number | null;
  diff_delta: number | null;
  trend_rank: Trend | null;
  trend_overall: Trend | null;
  diff_sign_changed: boolean | null;
};

type DbHomieDirectoryRow = Omit<
  HomieDirectoryRow,
  "updated_at" | "ranking_at"
> & {
  updated_at: Date | string | null;
  ranking_at: Date | string | null;
};

export async function listHomieDirectory(): Promise<HomieDirectoryRow[]> {
  const rows = await withDbRetry(() =>
    queryRows<DbHomieDirectoryRow>(`
      SELECT h.id,
             h.name,
             NULLIF(btrim(h.tag_slug), '') AS tag_slug,
             h.drafted,
             h.updated_at,
             COALESCE(NULLIF(btrim(h.tag_slug), ''), h.id::text) AS route_slug,
             r.card_count,
             r.ranking,
             r.ranking_at,
             r.difference,
             r.rank_delta,
             r.diff_delta,
             r.trend_rank,
             r.trend_overall,
             r.diff_sign_changed
        FROM dojo.homie AS h
        LEFT JOIN dojo.homie_tcdb_ranking_rt AS r ON r.homie_id = h.id
       ORDER BY r.card_count DESC NULLS LAST, h.name ASC, h.id ASC
    `),
  );

  return rows.map((row) => ({
    ...row,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    ranking_at: row.ranking_at ? asDateString(row.ranking_at) : null,
  }));
}
