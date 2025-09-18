-- db/scripts/refresh_homie_ranking_rt.sql
-- Usage: psql "$DATABASE_URL" -f db/scripts/refresh_homie_ranking_rt.sql
SELECT refresh_homie_tcdb_ranking_rt();
