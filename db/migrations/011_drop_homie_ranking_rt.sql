-- db/migrations/011_drop_homie_ranking_rt.sql
-- Purpose: Roll back the persisted homie_tcdb_ranking_rt table and refresh helper.
-- Verification:
--   psql "$DATABASE_URL" -c "SELECT to_regclass('public.homie_tcdb_ranking_rt');"

DROP FUNCTION IF EXISTS refresh_homie_tcdb_ranking_rt();
DROP INDEX IF EXISTS idx_homie_tcdb_ranking_rt_rank;
DROP TABLE IF EXISTS homie_tcdb_ranking_rt;
