-- 063_incremental_tcdb_ranking_refresh.sql
-- Purpose: keep TCDB derived ranking tables fresh for ordinary snapshot writes
-- without rebuilding every homie or clan on each row change.
--
-- The no-argument refresh functions remain the repair/backfill path and are
-- still used after TRUNCATE, where PostgreSQL does not expose affected row keys.

SET search_path = dojo, public;

CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_snapshot_rt(p_homie_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_homie_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM dojo.homie_tcdb_snapshot_rt
  WHERE homie_id = p_homie_id;

  INSERT INTO dojo.homie_tcdb_snapshot_rt (
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
    FROM dojo.homie_tcdb_snapshot AS s
    WHERE s.homie_id = p_homie_id
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
    FROM snapshot_history AS sh
    JOIN dojo.homie AS h ON h.id = sh.homie_id
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_homie_tcdb_snapshot_rt(BIGINT) IS
  'Refreshes homie_tcdb_snapshot_rt for one homie_id; use the no-argument function for full rebuilds.';

CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_ranking_rt(p_homie_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_homie_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM dojo.refresh_homie_tcdb_snapshot_rt(p_homie_id);

  DELETE FROM dojo.homie_tcdb_ranking_rt
  WHERE homie_id = p_homie_id;

  INSERT INTO dojo.homie_tcdb_ranking_rt (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM dojo.homie_tcdb_snapshot_rt
  WHERE homie_id = p_homie_id
  ORDER BY ranking_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_homie_tcdb_ranking_rt(BIGINT) IS
  'Refreshes homie_tcdb_ranking_rt for one homie_id after refreshing that homie history.';

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_snapshot_rt(
  p_clan_id BIGINT,
  p_sport TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_clan_id IS NULL OR NULLIF(BTRIM(p_sport), '') IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM dojo.clan_tcdb_snapshot_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport;

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
    FROM dojo.clan_tcdb_snapshot AS s
    WHERE s.clan_id = p_clan_id
      AND s.sport = p_sport
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
    FROM snapshot_history AS sh
    JOIN dojo.clan AS c ON c.id = sh.clan_id
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_clan_tcdb_snapshot_rt(BIGINT, TEXT) IS
  'Refreshes clan_tcdb_snapshot_rt for one clan_id and sport; use the no-argument function for full rebuilds.';

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_ranking_rt(
  p_clan_id BIGINT,
  p_sport TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_clan_id IS NULL OR NULLIF(BTRIM(p_sport), '') IS NULL THEN
    RETURN;
  END IF;

  PERFORM dojo.refresh_clan_tcdb_snapshot_rt(p_clan_id, p_sport);

  DELETE FROM dojo.clan_tcdb_ranking_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport;

  INSERT INTO dojo.clan_tcdb_ranking_rt (
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM dojo.clan_tcdb_snapshot_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport
  ORDER BY ranking_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_clan_tcdb_ranking_rt(BIGINT, TEXT) IS
  'Refreshes clan_tcdb_ranking_rt for one clan_id and sport after refreshing that clan sport history.';

CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt();
    RETURN NULL;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt(OLD.homie_id);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE')
    AND (TG_OP <> 'UPDATE' OR NEW.homie_id IS DISTINCT FROM OLD.homie_id)
  THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt(NEW.homie_id);
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_homie_tcdb_rankings_after_snapshot_write() IS
  'Trigger entrypoint. Row writes refresh affected homie_id values only; TRUNCATE falls back to a full rebuild.';

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt();
    RETURN NULL;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt(OLD.clan_id, OLD.sport);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE')
    AND (
      TG_OP <> 'UPDATE'
      OR NEW.clan_id IS DISTINCT FROM OLD.clan_id
      OR NEW.sport IS DISTINCT FROM OLD.sport
    )
  THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt(NEW.clan_id, NEW.sport);
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write() IS
  'Trigger entrypoint. Row writes refresh affected clan_id and sport values only; TRUNCATE falls back to a full rebuild.';

DROP TRIGGER IF EXISTS trg_refresh_homie_tcdb_rankings_after_snapshot_write
ON dojo.homie_tcdb_snapshot;
DROP TRIGGER IF EXISTS trg_refresh_homie_tcdb_rankings_after_snapshot_row_write
ON dojo.homie_tcdb_snapshot;
DROP TRIGGER IF EXISTS trg_refresh_homie_tcdb_rankings_after_snapshot_truncate
ON dojo.homie_tcdb_snapshot;

CREATE TRIGGER trg_refresh_homie_tcdb_rankings_after_snapshot_row_write
AFTER INSERT OR UPDATE OR DELETE
ON dojo.homie_tcdb_snapshot
FOR EACH ROW
EXECUTE FUNCTION dojo.refresh_homie_tcdb_rankings_after_snapshot_write();

CREATE TRIGGER trg_refresh_homie_tcdb_rankings_after_snapshot_truncate
AFTER TRUNCATE
ON dojo.homie_tcdb_snapshot
FOR EACH STATEMENT
EXECUTE FUNCTION dojo.refresh_homie_tcdb_rankings_after_snapshot_write();

DROP TRIGGER IF EXISTS trg_refresh_clan_tcdb_rankings_after_snapshot_write
ON dojo.clan_tcdb_snapshot;
DROP TRIGGER IF EXISTS trg_refresh_clan_tcdb_rankings_after_snapshot_row_write
ON dojo.clan_tcdb_snapshot;
DROP TRIGGER IF EXISTS trg_refresh_clan_tcdb_rankings_after_snapshot_truncate
ON dojo.clan_tcdb_snapshot;

CREATE TRIGGER trg_refresh_clan_tcdb_rankings_after_snapshot_row_write
AFTER INSERT OR UPDATE OR DELETE
ON dojo.clan_tcdb_snapshot
FOR EACH ROW
EXECUTE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write();

CREATE TRIGGER trg_refresh_clan_tcdb_rankings_after_snapshot_truncate
AFTER TRUNCATE
ON dojo.clan_tcdb_snapshot
FOR EACH STATEMENT
EXECUTE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT EXECUTE ON FUNCTION dojo.refresh_homie_tcdb_snapshot_rt(BIGINT) TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_homie_tcdb_ranking_rt(BIGINT) TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_snapshot_rt(BIGINT, TEXT) TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_ranking_rt(BIGINT, TEXT) TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_homie_tcdb_rankings_after_snapshot_write() TO app_user;
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write() TO app_user;
  END IF;
END;
$$;
