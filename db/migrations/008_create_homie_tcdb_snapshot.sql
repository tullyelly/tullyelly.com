-- 008_create_homie_tcdb_snapshot.sql
-- Purpose: Port homie_tcdb_snapshot structure with FK and audit behavior.
-- Validation:
--   psql $DATABASE_URL -c "\\d+ homie_tcdb_snapshot"
--   psql $DATABASE_URL <<'SQL_TEST'
--     BEGIN;
--     WITH seed_homie AS (
--       INSERT INTO homie (name, drafted)
--       VALUES ('tcdb validation homie', 0)
--       RETURNING id
--     )
--     INSERT INTO homie_tcdb_snapshot (homie_id, card_count, ranking, difference, ranking_at)
--     SELECT id, 0, 0, 0, '2024-01-01' FROM seed_homie;
--     INSERT INTO homie_tcdb_snapshot (homie_id, card_count, ranking, difference, ranking_at)
--     SELECT id, 1, 1, 1, '2024-01-01' FROM seed_homie; -- expect unique_violation once 009 runs
--     ROLLBACK;
--   SQL_TEST

CREATE TABLE IF NOT EXISTS homie_tcdb_snapshot (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  homie_id     BIGINT NOT NULL REFERENCES homie(id),
  card_count   INTEGER NOT NULL CHECK (card_count >= 0),
  ranking      INTEGER NOT NULL CHECK (ranking >= 0),
  difference   INTEGER NOT NULL,
  ranking_at   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by   VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at   TIMESTAMPTZ,
  updated_by   VARCHAR(100)
);

ALTER TABLE homie_tcdb_snapshot
  OWNER TO tullyelly_admin;

DROP TRIGGER IF EXISTS trg_audit_homie_tcdb_snapshot ON homie_tcdb_snapshot;
CREATE TRIGGER trg_audit_homie_tcdb_snapshot
BEFORE INSERT OR UPDATE ON homie_tcdb_snapshot
FOR EACH ROW
EXECUTE FUNCTION audit_stamp_generic();
