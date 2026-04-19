-- 045_create_lcs_tables.sql
-- Normalize cardattack local card shop metadata into dedicated header and
-- visit-day tables.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.lcs_header (
  id SERIAL PRIMARY KEY,
  lcs_slug TEXT NOT NULL,
  lcs_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  rating NUMERIC(4,2) NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.lcs_header
  ADD COLUMN IF NOT EXISTS lcs_slug TEXT,
  ADD COLUMN IF NOT EXISTS lcs_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.lcs_header
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.lcs_header
  ALTER COLUMN lcs_slug SET NOT NULL,
  ALTER COLUMN lcs_name SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_lcs_slug_key'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_lcs_slug_key
    UNIQUE (lcs_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_lcs_slug_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_lcs_slug_check
    CHECK (lcs_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_lcs_name_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_lcs_name_check
    CHECK (BTRIM(lcs_name) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_city_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_city_check
    CHECK (city IS NULL OR BTRIM(city) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_state_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_state_check
    CHECK (state IS NULL OR BTRIM(state) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_rating_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_rating_check
    CHECK (rating >= 1 AND rating <= 10);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_header_url_check'
      AND conrelid = 'dojo.lcs_header'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_header
    ADD CONSTRAINT lcs_header_url_check
    CHECK (url IS NULL OR BTRIM(url) <> '');
  END IF;
END
$$;

COMMENT ON TABLE dojo.lcs_header IS
  'Normalized local card shop metadata keyed by the stable lcs_slug used by the dedicated cardattack LCS routes.';

COMMENT ON COLUMN dojo.lcs_header.lcs_slug IS
  'Stable normalized local card shop slug used by the public /cardattack/lcs/[id] route.';

COMMENT ON COLUMN dojo.lcs_header.lcs_name IS
  'Display name for the local card shop.';

COMMENT ON COLUMN dojo.lcs_header.city IS
  'Optional city label for the local card shop.';

COMMENT ON COLUMN dojo.lcs_header.state IS
  'Optional state or territory label for the local card shop.';

COMMENT ON COLUMN dojo.lcs_header.rating IS
  'Overall local card shop rating stored once on the header row using a 1 to 10 scale.';

COMMENT ON COLUMN dojo.lcs_header.url IS
  'Optional canonical site URL for the local card shop.';

CREATE TABLE IF NOT EXISTS dojo.lcs_day (
  id SERIAL PRIMARY KEY,
  lcs_header_id INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.lcs_day
  ADD COLUMN IF NOT EXISTS lcs_header_id INTEGER,
  ADD COLUMN IF NOT EXISTS visit_date DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.lcs_day
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.lcs_day
  ALTER COLUMN lcs_header_id SET NOT NULL,
  ALTER COLUMN visit_date SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_day_lcs_header_id_fkey'
      AND conrelid = 'dojo.lcs_day'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_day
    ADD CONSTRAINT lcs_day_lcs_header_id_fkey
    FOREIGN KEY (lcs_header_id)
    REFERENCES dojo.lcs_header(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lcs_day_header_visit_date_key'
      AND conrelid = 'dojo.lcs_day'::regclass
  ) THEN
    ALTER TABLE dojo.lcs_day
    ADD CONSTRAINT lcs_day_header_visit_date_key
    UNIQUE (lcs_header_id, visit_date);
  END IF;
END
$$;

COMMENT ON TABLE dojo.lcs_day IS
  'Per-visit-day local card shop metadata keyed to dojo.lcs_header. One row per local card shop and visit_date.';

COMMENT ON COLUMN dojo.lcs_day.lcs_header_id IS
  'Foreign key to the parent local card shop header row.';

COMMENT ON COLUMN dojo.lcs_day.visit_date IS
  'ISO visit date for the local card shop; one row per lcs_slug and visit_date.';

CREATE INDEX IF NOT EXISTS idx_lcs_day_visit_date_desc
ON dojo.lcs_day(visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_lcs_day_header_visit_date_desc
ON dojo.lcs_day(lcs_header_id, visit_date DESC);

DROP TRIGGER IF EXISTS trg_audit_lcs_header ON dojo.lcs_header;
CREATE TRIGGER trg_audit_lcs_header
BEFORE INSERT OR UPDATE ON dojo.lcs_header
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_lcs_day ON dojo.lcs_day;
CREATE TRIGGER trg_audit_lcs_day
BEFORE INSERT OR UPDATE ON dojo.lcs_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
