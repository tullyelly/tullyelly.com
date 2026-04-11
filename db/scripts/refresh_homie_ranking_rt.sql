-- db/scripts/refresh_homie_ranking_rt.sql
-- Refreshes both homie_tcdb_snapshot_rt and homie_tcdb_ranking_rt.
-- Usage: psql "$DATABASE_URL" -f db/scripts/refresh_homie_ranking_rt.sql
SELECT refresh_homie_tcdb_ranking_rt();
