-- 009_create_homie_tcdb_snapshot_unique_idx.sql
-- Purpose: Enforce uniqueness of homie snapshots per ranking date.
-- Validation:
--   psql $DATABASE_URL -c "\\d+ homie_tcdb_snapshot" -- should list homie_tcdb_snapshot_unique_ranking_at

CREATE UNIQUE INDEX IF NOT EXISTS homie_tcdb_snapshot_unique_ranking_at
  ON homie_tcdb_snapshot (homie_id, ranking_at);
