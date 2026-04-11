-- docs/homie_ranking_rt_verification.sql
-- Purpose: Post-refresh validation queries for homie_tcdb_snapshot_rt and
-- homie_tcdb_ranking_rt.
-- Usage:
--   psql "$DATABASE_URL" -f docs/homie_ranking_rt_verification.sql

-- Backfill once:
SELECT refresh_homie_tcdb_ranking_rt();

-- 1) Null tag_slug values are expected until you assign them manually; only
-- populated slugs should be validated.
SELECT *
FROM homie
WHERE tag_slug IS NOT NULL
  AND (tag_slug = '' OR tag_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
LIMIT 20;

-- 2) Populated homie tag slugs must be unique:
SELECT tag_slug, COUNT(*) AS homie_count
FROM homie
WHERE tag_slug IS NOT NULL
GROUP BY tag_slug
HAVING COUNT(*) > 1;

-- 3) Every raw snapshot should appear exactly once in the historical RT table:
SELECT
  (SELECT COUNT(*) FROM homie_tcdb_snapshot) AS raw_snapshot_rows,
  (SELECT COUNT(*) FROM homie_tcdb_snapshot_rt) AS snapshot_rt_rows;

-- 4) Every homie with at least one snapshot should appear exactly once:
SELECT COUNT(*) AS rows_in_rt FROM homie_tcdb_ranking_rt;

-- 5) Spot-check nulls and data plausibility:
SELECT *
FROM homie_tcdb_snapshot_rt
WHERE ranking IS NULL OR ranking_at IS NULL
LIMIT 20;

SELECT * FROM homie_tcdb_ranking_rt WHERE ranking IS NULL OR ranking_at IS NULL LIMIT 20;

-- 6) Trend logic sanity in the historical table: if rank_delta > 0 then trend_rank='up'
SELECT COUNT(*) AS bad_snapshot_rt_trend_rank
FROM homie_tcdb_snapshot_rt
WHERE (rank_delta > 0 AND trend_rank <> 'up')
   OR (rank_delta < 0 AND trend_rank <> 'down')
   OR (rank_delta = 0 AND trend_rank <> 'flat');

-- 7) Trend logic sanity in the latest-only table: if rank_delta > 0 then trend_rank='up'
SELECT COUNT(*) AS bad_trend_rank
FROM homie_tcdb_ranking_rt
WHERE (rank_delta > 0 AND trend_rank <> 'up')
   OR (rank_delta < 0 AND trend_rank <> 'down')
   OR (rank_delta = 0 AND trend_rank <> 'flat');

-- 8) If rank_delta=0 then trend_overall should reflect diff_delta sign
SELECT *
FROM homie_tcdb_ranking_rt
WHERE rank_delta = 0
  AND diff_delta IS NOT NULL
  AND ((diff_delta > 0 AND trend_overall <> 'up')
    OR (diff_delta < 0 AND trend_overall <> 'down'))
LIMIT 20;

-- 9) Latest rows in snapshot_rt should match ranking_rt one-for-one
SELECT
  rt.homie_id,
  rt.ranking_at AS ranking_rt_date,
  snap.ranking_at AS snapshot_rt_date,
  rt.ranking AS ranking_rt_rank,
  snap.ranking AS snapshot_rt_rank
FROM homie_tcdb_ranking_rt rt
JOIN LATERAL (
  SELECT s.*
  FROM homie_tcdb_snapshot_rt s
  WHERE s.homie_id = rt.homie_id
  ORDER BY s.ranking_at DESC
  LIMIT 1
) snap ON TRUE
WHERE rt.ranking_at <> snap.ranking_at
   OR rt.ranking <> snap.ranking
LIMIT 20;

-- 10) Top 10 by current ranking (for UI)
SELECT * FROM homie_tcdb_ranking_rt ORDER BY ranking ASC, ranking_at DESC LIMIT 10;
