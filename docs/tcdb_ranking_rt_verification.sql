-- docs/tcdb_ranking_rt_verification.sql
-- Purpose: verify TCDB raw snapshots, derived history tables, derived ranking
-- tables, and refresh triggers after migration 063.
-- Usage:
--   psql "$DATABASE_URL" -f docs/tcdb_ranking_rt_verification.sql

\timing on

-- 1) Snapshot refresh triggers should be row-scoped for writes and
-- statement-scoped only for TRUNCATE.
SELECT
  trigger_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'dojo'
  AND event_object_table IN ('homie_tcdb_snapshot', 'clan_tcdb_snapshot')
  AND trigger_name LIKE 'trg_refresh_%_tcdb_rankings_after_snapshot_%'
ORDER BY event_object_table, trigger_name, event_manipulation;

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger AS t
JOIN pg_class AS c
  ON c.oid = t.tgrelid
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname = 'dojo'
  AND c.relname IN ('homie_tcdb_snapshot', 'clan_tcdb_snapshot')
  AND t.tgname LIKE 'trg_refresh_%_tcdb_rankings_after_snapshot_%'
ORDER BY c.relname, t.tgname;

-- 2) Every raw homie snapshot should appear exactly once in the homie history
-- derived table.
SELECT
  (SELECT COUNT(*) FROM dojo.homie_tcdb_snapshot) AS raw_snapshot_rows,
  (SELECT COUNT(*) FROM dojo.homie_tcdb_snapshot_rt) AS snapshot_rt_rows;

-- 3) Latest raw homie snapshots should match the homie latest-row table.
WITH latest_raw AS (
  SELECT DISTINCT ON (homie_id)
    homie_id,
    card_count,
    ranking,
    ranking_at,
    difference
  FROM dojo.homie_tcdb_snapshot
  ORDER BY homie_id, ranking_at DESC
)
SELECT
  COALESCE(raw.homie_id, rt.homie_id) AS homie_id,
  raw.ranking_at AS raw_ranking_at,
  rt.ranking_at AS rt_ranking_at,
  raw.ranking AS raw_ranking,
  rt.ranking AS rt_ranking,
  raw.card_count AS raw_card_count,
  rt.card_count AS rt_card_count,
  raw.difference AS raw_difference,
  rt.difference AS rt_difference
FROM latest_raw AS raw
FULL JOIN dojo.homie_tcdb_ranking_rt AS rt
  ON rt.homie_id = raw.homie_id
WHERE raw.homie_id IS NULL
   OR rt.homie_id IS NULL
   OR raw.ranking_at IS DISTINCT FROM rt.ranking_at
   OR raw.ranking IS DISTINCT FROM rt.ranking
   OR raw.card_count IS DISTINCT FROM rt.card_count
   OR raw.difference IS DISTINCT FROM rt.difference
ORDER BY homie_id
LIMIT 50;

-- 4) Latest homie history rows should match the homie latest-row table.
WITH latest_history AS (
  SELECT DISTINCT ON (homie_id)
    homie_id,
    card_count,
    ranking,
    ranking_at,
    difference
  FROM dojo.homie_tcdb_snapshot_rt
  ORDER BY homie_id, ranking_at DESC
)
SELECT
  COALESCE(history.homie_id, rt.homie_id) AS homie_id,
  history.ranking_at AS history_ranking_at,
  rt.ranking_at AS rt_ranking_at,
  history.ranking AS history_ranking,
  rt.ranking AS rt_ranking
FROM latest_history AS history
FULL JOIN dojo.homie_tcdb_ranking_rt AS rt
  ON rt.homie_id = history.homie_id
WHERE history.homie_id IS NULL
   OR rt.homie_id IS NULL
   OR history.ranking_at IS DISTINCT FROM rt.ranking_at
   OR history.ranking IS DISTINCT FROM rt.ranking
ORDER BY homie_id
LIMIT 50;

-- 5) Every raw clan snapshot should appear exactly once in the clan history
-- derived table.
SELECT
  (SELECT COUNT(*) FROM dojo.clan_tcdb_snapshot) AS raw_snapshot_rows,
  (SELECT COUNT(*) FROM dojo.clan_tcdb_snapshot_rt) AS snapshot_rt_rows;

-- 6) Latest raw clan snapshots should match the clan latest-row table.
WITH latest_raw AS (
  SELECT DISTINCT ON (clan_id, sport)
    clan_id,
    sport,
    card_count,
    ranking,
    ranking_at,
    difference
  FROM dojo.clan_tcdb_snapshot
  ORDER BY clan_id, sport, ranking_at DESC
)
SELECT
  COALESCE(raw.clan_id, rt.clan_id) AS clan_id,
  COALESCE(raw.sport, rt.sport) AS sport,
  raw.ranking_at AS raw_ranking_at,
  rt.ranking_at AS rt_ranking_at,
  raw.ranking AS raw_ranking,
  rt.ranking AS rt_ranking,
  raw.card_count AS raw_card_count,
  rt.card_count AS rt_card_count,
  raw.difference AS raw_difference,
  rt.difference AS rt_difference
FROM latest_raw AS raw
FULL JOIN dojo.clan_tcdb_ranking_rt AS rt
  ON rt.clan_id = raw.clan_id
 AND rt.sport = raw.sport
WHERE raw.clan_id IS NULL
   OR rt.clan_id IS NULL
   OR raw.ranking_at IS DISTINCT FROM rt.ranking_at
   OR raw.ranking IS DISTINCT FROM rt.ranking
   OR raw.card_count IS DISTINCT FROM rt.card_count
   OR raw.difference IS DISTINCT FROM rt.difference
ORDER BY clan_id, sport
LIMIT 50;

-- 7) Latest clan history rows should match the clan latest-row table.
WITH latest_history AS (
  SELECT DISTINCT ON (clan_id, sport)
    clan_id,
    sport,
    card_count,
    ranking,
    ranking_at,
    difference
  FROM dojo.clan_tcdb_snapshot_rt
  ORDER BY clan_id, sport, ranking_at DESC
)
SELECT
  COALESCE(history.clan_id, rt.clan_id) AS clan_id,
  COALESCE(history.sport, rt.sport) AS sport,
  history.ranking_at AS history_ranking_at,
  rt.ranking_at AS rt_ranking_at,
  history.ranking AS history_ranking,
  rt.ranking AS rt_ranking
FROM latest_history AS history
FULL JOIN dojo.clan_tcdb_ranking_rt AS rt
  ON rt.clan_id = history.clan_id
 AND rt.sport = history.sport
WHERE history.clan_id IS NULL
   OR rt.clan_id IS NULL
   OR history.ranking_at IS DISTINCT FROM rt.ranking_at
   OR history.ranking IS DISTINCT FROM rt.ranking
ORDER BY clan_id, sport
LIMIT 50;
