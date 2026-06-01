-- 049_create_clan_tcdb_rankings.sql
-- Purpose: Add clan TCDB ranking tables and refresh helpers alongside homie rankings.

SET search_path = dojo, public;

CREATE TABLE IF NOT EXISTS dojo.clan (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  tag_slug    VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at  TIMESTAMPTZ,
  updated_by  VARCHAR(100),
  CONSTRAINT clan_slug_key UNIQUE (slug),
  CONSTRAINT clan_tag_slug_key UNIQUE (tag_slug),
  CONSTRAINT clan_tag_slug_check
    CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT clan_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

ALTER TABLE dojo.clan
  ADD COLUMN IF NOT EXISTS tag_slug VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clan_tag_slug_key'
      AND conrelid = 'dojo.clan'::regclass
  ) THEN
    ALTER TABLE dojo.clan
    ADD CONSTRAINT clan_tag_slug_key
    UNIQUE (tag_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clan_tag_slug_check'
      AND conrelid = 'dojo.clan'::regclass
  ) THEN
    ALTER TABLE dojo.clan
    ADD CONSTRAINT clan_tag_slug_check
    CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;

ALTER TABLE dojo.clan
  OWNER TO tullyelly_admin;

CREATE INDEX IF NOT EXISTS idx_clan_name
  ON dojo.clan (name ASC);

DROP TRIGGER IF EXISTS trg_audit_clan ON dojo.clan;
CREATE TRIGGER trg_audit_clan
BEFORE INSERT OR UPDATE ON dojo.clan
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_snapshot (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clan_id      BIGINT NOT NULL REFERENCES dojo.clan(id),
  sport        VARCHAR(100) NOT NULL,
  card_count   INTEGER NOT NULL CHECK (card_count >= 0),
  ranking      INTEGER NOT NULL CHECK (ranking >= 0),
  difference   INTEGER NOT NULL,
  ranking_at   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by   VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at   TIMESTAMPTZ,
  updated_by   VARCHAR(100),
  CONSTRAINT clan_tcdb_snapshot_sport_check
    CHECK (sport ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

ALTER TABLE dojo.clan_tcdb_snapshot
  OWNER TO tullyelly_admin;

CREATE UNIQUE INDEX IF NOT EXISTS clan_tcdb_snapshot_unique_sport_ranking_at
  ON dojo.clan_tcdb_snapshot (clan_id, sport, ranking_at);

DROP TRIGGER IF EXISTS trg_audit_clan_tcdb_snapshot ON dojo.clan_tcdb_snapshot;
CREATE TRIGGER trg_audit_clan_tcdb_snapshot
BEFORE INSERT OR UPDATE ON dojo.clan_tcdb_snapshot
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_snapshot_rt (
  clan_id          BIGINT NOT NULL,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  sport            TEXT NOT NULL CHECK (sport ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  card_count       INTEGER NOT NULL,
  ranking          INTEGER NOT NULL,
  ranking_at       DATE NOT NULL,
  difference       INTEGER NOT NULL,

  prev_card_count  INTEGER,
  prev_ranking     INTEGER,
  prev_difference  INTEGER,
  prev_ranking_at  DATE,

  card_count_delta INTEGER,
  rank_delta       INTEGER,
  diff_delta       INTEGER,
  trend_rank       TEXT CHECK (trend_rank IN ('up','down','flat')),
  trend_overall    TEXT CHECK (trend_overall IN ('up','down','flat')),
  diff_sign_changed BOOLEAN NOT NULL DEFAULT FALSE,

  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (clan_id, sport, ranking_at)
);

ALTER TABLE dojo.clan_tcdb_snapshot_rt
  OWNER TO tullyelly_admin;

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_snapshot_rt_rank
  ON dojo.clan_tcdb_snapshot_rt (ranking_at DESC, ranking ASC);

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_snapshot_rt_slug_sport
  ON dojo.clan_tcdb_snapshot_rt (slug, sport, ranking_at DESC);

CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_ranking_rt (
  clan_id           BIGINT NOT NULL,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  sport             TEXT NOT NULL CHECK (sport ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  card_count        INTEGER NOT NULL,
  ranking           INTEGER NOT NULL,
  ranking_at        DATE NOT NULL,
  difference        INTEGER NOT NULL,

  prev_ranking      INTEGER,
  prev_difference   INTEGER,
  prev_ranking_at   DATE,

  rank_delta        INTEGER,
  diff_delta        INTEGER,
  trend_rank        TEXT CHECK (trend_rank IN ('up','down','flat')),
  trend_overall     TEXT CHECK (trend_overall IN ('up','down','flat')),
  diff_sign_changed BOOLEAN NOT NULL DEFAULT FALSE,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (clan_id, sport)
);

ALTER TABLE dojo.clan_tcdb_ranking_rt
  OWNER TO tullyelly_admin;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clan_tcdb_ranking_rt_slug_sport
  ON dojo.clan_tcdb_ranking_rt (slug, sport);

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_ranking_rt_rank
  ON dojo.clan_tcdb_ranking_rt (ranking ASC, ranking_at DESC);

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_snapshot_rt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  TRUNCATE TABLE dojo.clan_tcdb_snapshot_rt;

  INSERT INTO dojo.clan_tcdb_snapshot_rt (
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH snapshot_history AS (
    SELECT
      s.clan_id,
      s.sport,
      s.card_count,
      s.ranking,
      s.difference,
      s.ranking_at,
      LAG(s.card_count) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_card_count,
      LAG(s.ranking) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_ranking,
      LAG(s.difference) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_difference,
      LAG(s.ranking_at) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_ranking_at
    FROM dojo.clan_tcdb_snapshot s
  ),
  final AS (
    SELECT
      c.id AS clan_id,
      c.name,
      c.slug,
      sh.sport,
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
    JOIN dojo.clan c ON c.id = sh.clan_id
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_ranking_rt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM dojo.refresh_clan_tcdb_snapshot_rt();

  TRUNCATE TABLE dojo.clan_tcdb_ranking_rt;

  INSERT INTO dojo.clan_tcdb_ranking_rt (
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH ranked AS (
    SELECT
      s.*,
      ROW_NUMBER() OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at DESC) AS rn
    FROM dojo.clan_tcdb_snapshot_rt s
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM ranked
  WHERE rn = 1;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.clan TO app_user;
    GRANT SELECT ON TABLE dojo.clan_tcdb_snapshot TO app_user;
    GRANT SELECT ON TABLE dojo.clan_tcdb_snapshot_rt TO app_user;
    GRANT SELECT ON TABLE dojo.clan_tcdb_ranking_rt TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_snapshot_rt() TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_ranking_rt() TO app_user;
  END IF;
END;
$$;
