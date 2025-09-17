-- db/migrations/010_create_homie_ranking_rt.sql
-- Purpose: Replace the MySQL homie_tcdb_ranking view with a persisted Postgres table plus refresh helper.
-- Verification:
--   psql "$DATABASE_URL" -c "SELECT refresh_homie_tcdb_ranking_rt();"
--   psql "$DATABASE_URL" -f docs/homie_ranking_rt_verification.sql

CREATE TABLE IF NOT EXISTS homie_tcdb_ranking_rt (
  homie_id           BIGINT PRIMARY KEY,
  name               TEXT NOT NULL,
  card_count         INTEGER NOT NULL,
  ranking            INTEGER NOT NULL,
  ranking_at         DATE NOT NULL,
  difference         INTEGER NOT NULL,

  prev_ranking       INTEGER,
  prev_difference    INTEGER,
  prev_ranking_at    DATE,

  rank_delta         INTEGER,
  diff_delta         INTEGER,
  trend_rank         TEXT CHECK (trend_rank IN ('up','down','flat')),
  trend_overall      TEXT CHECK (trend_overall IN ('up','down','flat')),
  diff_sign_changed  BOOLEAN NOT NULL DEFAULT FALSE,

  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homie_tcdb_ranking_rt_rank
  ON homie_tcdb_ranking_rt (ranking, ranking_at DESC);

CREATE OR REPLACE FUNCTION refresh_homie_tcdb_ranking_rt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH latest_and_prev AS (
    SELECT
      s.homie_id,
      s.card_count,
      s.ranking,
      s.difference,
      s.ranking_at,
      LAG(s.ranking)    OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking,
      LAG(s.difference) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_difference,
      LAG(s.ranking_at) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking_at
    FROM homie_tcdb_snapshot s
  ),
  ranked AS (
    SELECT
      lp.*,
      ROW_NUMBER() OVER (PARTITION BY lp.homie_id ORDER BY lp.ranking_at DESC) AS rn
    FROM latest_and_prev lp
  ),
  resolved AS (
    SELECT r.*
    FROM ranked r
    WHERE r.rn = 1
  ),
  final AS (
    SELECT
      h.id AS homie_id,
      h.name,
      r.card_count,
      r.ranking,
      r.ranking_at,
      r.difference,
      r.prev_ranking,
      r.prev_difference,
      r.prev_ranking_at,
      (r.prev_ranking - r.ranking) AS rank_delta,
      (r.difference - r.prev_difference) AS diff_delta,
      CASE
        WHEN r.prev_ranking IS NULL THEN 'flat'
        WHEN (r.prev_ranking - r.ranking) > 0 THEN 'up'
        WHEN (r.prev_ranking - r.ranking) < 0 THEN 'down'
        ELSE 'flat'
      END AS trend_rank,
      CASE
        WHEN r.prev_ranking IS NULL THEN 'flat'
        WHEN (r.prev_ranking - r.ranking) <> 0 THEN
          CASE WHEN (r.prev_ranking - r.ranking) > 0 THEN 'up' ELSE 'down' END
        WHEN (r.difference - r.prev_difference) IS NOT NULL AND (r.difference - r.prev_difference) <> 0 THEN
          CASE WHEN (r.difference - r.prev_difference) > 0 THEN 'up' ELSE 'down' END
        ELSE 'flat'
      END AS trend_overall,
      CASE
        WHEN r.prev_difference IS NULL THEN FALSE
        WHEN (r.prev_difference < 0 AND r.difference >= 0)
          OR (r.prev_difference >= 0 AND r.difference < 0)
        THEN TRUE
        ELSE FALSE
      END AS diff_sign_changed
    FROM resolved r
    JOIN homie h ON h.id = r.homie_id
  )
  INSERT INTO homie_tcdb_ranking_rt AS t (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM final
  ON CONFLICT (homie_id) DO UPDATE
  SET
    name              = EXCLUDED.name,
    card_count        = EXCLUDED.card_count,
    ranking           = EXCLUDED.ranking,
    ranking_at        = EXCLUDED.ranking_at,
    difference        = EXCLUDED.difference,
    prev_ranking      = EXCLUDED.prev_ranking,
    prev_difference   = EXCLUDED.prev_difference,
    prev_ranking_at   = EXCLUDED.prev_ranking_at,
    rank_delta        = EXCLUDED.rank_delta,
    diff_delta        = EXCLUDED.diff_delta,
    trend_rank        = EXCLUDED.trend_rank,
    trend_overall     = EXCLUDED.trend_overall,
    diff_sign_changed = EXCLUDED.diff_sign_changed,
    updated_at        = now();
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE homie_tcdb_ranking_rt TO app_user;
    GRANT EXECUTE ON FUNCTION refresh_homie_tcdb_ranking_rt() TO app_user;
  END IF;
END;
$$;

-- OPTIONAL pg_cron schedule (requires pg_cron extension installed)
-- SELECT cron.schedule('0 3 * * *', $$SELECT refresh_homie_tcdb_ranking_rt();$$);
