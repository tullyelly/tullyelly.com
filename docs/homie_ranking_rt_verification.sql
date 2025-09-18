-- docs/homie_ranking_rt_verification.sql
-- Purpose: Post-refresh validation queries for homie_tcdb_ranking_rt.
-- Usage:
--   psql "$DATABASE_URL" -f docs/homie_ranking_rt_verification.sql

-- Backfill once:
SELECT refresh_homie_tcdb_ranking_rt();

-- 1) Every homie with at least one snapshot should appear exactly once:
SELECT COUNT(*) AS rows_in_rt FROM homie_tcdb_ranking_rt;

-- 2) Spot-check nulls and data plausibility:
SELECT * FROM homie_tcdb_ranking_rt WHERE ranking IS NULL OR ranking_at IS NULL LIMIT 20;

-- 3) Trend logic sanity: if rank_delta > 0 then trend_rank='up'
SELECT COUNT(*) AS bad_trend_rank
FROM homie_tcdb_ranking_rt
WHERE (rank_delta > 0 AND trend_rank <> 'up')
   OR (rank_delta < 0 AND trend_rank <> 'down')
   OR (rank_delta = 0 AND trend_rank <> 'flat');

-- 4) If rank_delta=0 then trend_overall should reflect diff_delta sign
SELECT *
FROM homie_tcdb_ranking_rt
WHERE rank_delta = 0
  AND diff_delta IS NOT NULL
  AND ((diff_delta > 0 AND trend_overall <> 'up')
    OR (diff_delta < 0 AND trend_overall <> 'down'))
LIMIT 20;

-- 5) Top 10 by current ranking (for UI)
SELECT * FROM homie_tcdb_ranking_rt ORDER BY ranking ASC, ranking_at DESC LIMIT 10;
