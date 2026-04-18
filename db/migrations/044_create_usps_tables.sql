-- 042_create_usps_tables.sql
-- Normalize cardattack USPS visit metadata into location header and visit-day
-- tables.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.usps_header (
  id SERIAL PRIMARY KEY,
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  state TEXT NOT NULL,
  rating NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.usps_header
  ADD COLUMN IF NOT EXISTS city_slug TEXT,
  ADD COLUMN IF NOT EXISTS city_name TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.usps_header
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.usps_header
  ALTER COLUMN city_slug SET NOT NULL,
  ALTER COLUMN city_name SET NOT NULL,
  ALTER COLUMN state SET NOT NULL,
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
    WHERE conname = 'usps_header_city_slug_key'
      AND conrelid = 'dojo.usps_header'::regclass
  ) THEN
    ALTER TABLE dojo.usps_header
    ADD CONSTRAINT usps_header_city_slug_key
    UNIQUE (city_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usps_header_city_slug_check'
      AND conrelid = 'dojo.usps_header'::regclass
  ) THEN
    ALTER TABLE dojo.usps_header
    ADD CONSTRAINT usps_header_city_slug_check
    CHECK (city_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usps_header_city_name_check'
      AND conrelid = 'dojo.usps_header'::regclass
  ) THEN
    ALTER TABLE dojo.usps_header
    ADD CONSTRAINT usps_header_city_name_check
    CHECK (BTRIM(city_name) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usps_header_state_check'
      AND conrelid = 'dojo.usps_header'::regclass
  ) THEN
    ALTER TABLE dojo.usps_header
    ADD CONSTRAINT usps_header_state_check
    CHECK (BTRIM(state) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usps_header_rating_check'
      AND conrelid = 'dojo.usps_header'::regclass
  ) THEN
    ALTER TABLE dojo.usps_header
    ADD CONSTRAINT usps_header_rating_check
    CHECK (rating >= 1 AND rating <= 10);
  END IF;
END
$$;

COMMENT ON TABLE dojo.usps_header IS
  'Normalized USPS location metadata keyed by the stable city_slug used in cardattack USPS routes.';

COMMENT ON COLUMN dojo.usps_header.city_slug IS
  'Stable normalized city slug used by the public /cardattack/usps/[id] route.';

COMMENT ON COLUMN dojo.usps_header.city_name IS
  'Display city name for the USPS location.';

COMMENT ON COLUMN dojo.usps_header.state IS
  'State or territory label paired with the USPS city_name.';

COMMENT ON COLUMN dojo.usps_header.rating IS
  'Overall USPS location rating stored on a 1 to 10 scale.';

CREATE TABLE IF NOT EXISTS dojo.usps_day (
  id SERIAL PRIMARY KEY,
  usps_header_id INTEGER NOT NULL,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.usps_day
  ADD COLUMN IF NOT EXISTS usps_header_id INTEGER,
  ADD COLUMN IF NOT EXISTS visit_date DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.usps_day
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.usps_day
  ALTER COLUMN usps_header_id SET NOT NULL,
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
    WHERE conname = 'usps_day_usps_header_id_fkey'
      AND conrelid = 'dojo.usps_day'::regclass
  ) THEN
    ALTER TABLE dojo.usps_day
    ADD CONSTRAINT usps_day_usps_header_id_fkey
    FOREIGN KEY (usps_header_id)
    REFERENCES dojo.usps_header(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usps_day_header_visit_date_key'
      AND conrelid = 'dojo.usps_day'::regclass
  ) THEN
    ALTER TABLE dojo.usps_day
    ADD CONSTRAINT usps_day_header_visit_date_key
    UNIQUE (usps_header_id, visit_date);
  END IF;
END
$$;

COMMENT ON TABLE dojo.usps_day IS
  'Per-visit-day USPS metadata keyed to dojo.usps_header. One row per location and visit_date.';

COMMENT ON COLUMN dojo.usps_day.usps_header_id IS
  'Foreign key to the parent USPS header row.';

COMMENT ON COLUMN dojo.usps_day.visit_date IS
  'ISO visit date for the USPS location; one row per city_slug and visit_date.';

CREATE INDEX IF NOT EXISTS idx_usps_day_visit_date_desc
ON dojo.usps_day(visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_usps_day_header_visit_date_desc
ON dojo.usps_day(usps_header_id, visit_date DESC);

DROP TRIGGER IF EXISTS trg_audit_usps_header ON dojo.usps_header;
CREATE TRIGGER trg_audit_usps_header
BEFORE INSERT OR UPDATE ON dojo.usps_header
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_usps_day ON dojo.usps_day;
CREATE TRIGGER trg_audit_usps_day
BEFORE INSERT OR UPDATE ON dojo.usps_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
