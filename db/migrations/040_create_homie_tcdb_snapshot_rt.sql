-- db/migrations/040_create_homie_tcdb_snapshot_rt.sql
-- Purpose: Add a per-snapshot refreshed TCDB comparison table and make the
-- existing ranking_rt refresh entrypoint rebuild both TCDB derived datasets.
-- Verification:
--   psql "$DATABASE_URL" -c "SELECT refresh_homie_tcdb_ranking_rt();"
--   psql "$DATABASE_URL" -f docs/homie_ranking_rt_verification.sql

ALTER TABLE homie
  ADD COLUMN IF NOT EXISTS tag_slug VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'homie_tag_slug_key'
      AND conrelid = 'homie'::regclass
  ) THEN
    ALTER TABLE homie
    ADD CONSTRAINT homie_tag_slug_key
    UNIQUE (tag_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'homie_tag_slug_check'
      AND conrelid = 'homie'::regclass
  ) THEN
    ALTER TABLE homie
    ADD CONSTRAINT homie_tag_slug_check
    CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS homie_tcdb_snapshot_rt (
  homie_id          BIGINT NOT NULL,
  name              TEXT NOT NULL,
  card_count        INTEGER NOT NULL,
  ranking           INTEGER NOT NULL,
  ranking_at        DATE NOT NULL,
  difference        INTEGER NOT NULL,

  prev_card_count   INTEGER,
  prev_ranking      INTEGER,
  prev_difference   INTEGER,
  prev_ranking_at   DATE,

  card_count_delta  INTEGER,
  rank_delta        INTEGER,
  diff_delta        INTEGER,
  trend_rank        TEXT CHECK (trend_rank IN ('up','down','flat')),
  trend_overall     TEXT CHECK (trend_overall IN ('up','down','flat')),
  diff_sign_changed BOOLEAN NOT NULL DEFAULT FALSE,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (homie_id, ranking_at)
);

CREATE INDEX IF NOT EXISTS idx_homie_tcdb_snapshot_rt_rank
  ON homie_tcdb_snapshot_rt (ranking_at DESC, ranking ASC);

CREATE OR REPLACE FUNCTION refresh_homie_tcdb_snapshot_rt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  TRUNCATE TABLE homie_tcdb_snapshot_rt;

  INSERT INTO homie_tcdb_snapshot_rt (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH snapshot_history AS (
    SELECT
      s.homie_id,
      s.card_count,
      s.ranking,
      s.difference,
      s.ranking_at,
      LAG(s.card_count) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_card_count,
      LAG(s.ranking) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking,
      LAG(s.difference) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_difference,
      LAG(s.ranking_at) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking_at
    FROM homie_tcdb_snapshot s
  ),
  final AS (
    SELECT
      h.id AS homie_id,
      h.name,
      sh.card_count,
      sh.ranking,
      sh.ranking_at,
      sh.difference,
      sh.prev_card_count,
      sh.prev_ranking,
      sh.prev_difference,
      sh.prev_ranking_at,
      (sh.card_count - sh.prev_card_count) AS card_count_delta,
      (sh.prev_ranking - sh.ranking) AS rank_delta,
      (sh.difference - sh.prev_difference) AS diff_delta,
      CASE
        WHEN sh.prev_ranking IS NULL THEN 'flat'
        WHEN (sh.prev_ranking - sh.ranking) > 0 THEN 'up'
        WHEN (sh.prev_ranking - sh.ranking) < 0 THEN 'down'
        ELSE 'flat'
      END AS trend_rank,
      CASE
        WHEN sh.prev_ranking IS NULL THEN 'flat'
        WHEN (sh.prev_ranking - sh.ranking) <> 0 THEN
          CASE WHEN (sh.prev_ranking - sh.ranking) > 0 THEN 'up' ELSE 'down' END
        WHEN (sh.difference - sh.prev_difference) IS NOT NULL
          AND (sh.difference - sh.prev_difference) <> 0 THEN
          CASE WHEN (sh.difference - sh.prev_difference) > 0 THEN 'up' ELSE 'down' END
        ELSE 'flat'
      END AS trend_overall,
      CASE
        WHEN sh.prev_difference IS NULL THEN FALSE
        WHEN (sh.prev_difference < 0 AND sh.difference >= 0)
          OR (sh.prev_difference >= 0 AND sh.difference < 0)
        THEN TRUE
        ELSE FALSE
      END AS diff_sign_changed
    FROM snapshot_history sh
    JOIN homie h ON h.id = sh.homie_id
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_homie_tcdb_ranking_rt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_homie_tcdb_snapshot_rt();

  TRUNCATE TABLE homie_tcdb_ranking_rt;

  INSERT INTO homie_tcdb_ranking_rt (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH ranked AS (
    SELECT
      s.*,
      ROW_NUMBER() OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at DESC) AS rn
    FROM homie_tcdb_snapshot_rt s
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM ranked
  WHERE rn = 1;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE homie TO app_user;
    GRANT SELECT ON TABLE homie_tcdb_snapshot_rt TO app_user;
    GRANT SELECT ON TABLE homie_tcdb_ranking_rt TO app_user;
    GRANT EXECUTE ON FUNCTION refresh_homie_tcdb_snapshot_rt() TO app_user;
    GRANT EXECUTE ON FUNCTION refresh_homie_tcdb_ranking_rt() TO app_user;
  END IF;
END;
$$;
