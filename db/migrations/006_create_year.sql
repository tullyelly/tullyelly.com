-- 006_create_year.sql
-- Purpose: Introduce the year table with composite uniqueness and audit support.
-- Validation:
--   psql $DATABASE_URL -c "\\d+ year"
--   psql $DATABASE_URL -c "SELECT COUNT(*) FROM year;" -- after seed migration

CREATE TABLE IF NOT EXISTS year (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year        SMALLINT NOT NULL,
  multi_year  CHAR(7) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at  TIMESTAMPTZ,
  updated_by  VARCHAR(100),
  CONSTRAINT year_year_check CHECK (year BETWEEN 1800 AND 3000),
  CONSTRAINT uq_year_multi_year UNIQUE (year, multi_year)
);

ALTER TABLE year
  OWNER TO tullyelly_admin;

DROP TRIGGER IF EXISTS trg_audit_year ON year;
CREATE TRIGGER trg_audit_year
BEFORE INSERT OR UPDATE ON year
FOR EACH ROW
EXECUTE FUNCTION audit_stamp_generic();
