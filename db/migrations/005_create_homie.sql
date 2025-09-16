-- 005_create_homie.sql
-- Purpose: Port the MySQL homie table into PostgreSQL with audit trigger parity.
-- Validation:
--   psql $DATABASE_URL -c "\\d+ homie"
--   psql $DATABASE_URL <<'SQL_TEST'
--     WITH inserted AS (
--       INSERT INTO homie (name, drafted)
--       VALUES ('validation homie', 1)
--       RETURNING id
--     ),
--     updated AS (
--       UPDATE homie
--          SET drafted = 2
--        WHERE id IN (SELECT id FROM inserted)
--       RETURNING id
--     )
--     SELECT id, created_at, created_by, updated_at, updated_by
--       FROM homie
--      WHERE id IN (SELECT id FROM updated);
--   SQL_TEST

CREATE TABLE IF NOT EXISTS homie (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  drafted     INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at  TIMESTAMPTZ,
  updated_by  VARCHAR(100),
  CONSTRAINT homie_drafted_check CHECK (drafted BETWEEN 0 AND 65535)
);

ALTER TABLE homie
  OWNER TO tullyelly_admin;

DROP TRIGGER IF EXISTS trg_audit_homie ON homie;
CREATE TRIGGER trg_audit_homie
BEFORE INSERT OR UPDATE ON homie
FOR EACH ROW
EXECUTE FUNCTION audit_stamp_generic();
