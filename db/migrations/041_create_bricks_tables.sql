-- 041_create_bricks_tables.sql
-- Normalize bricks metadata into shared header and build-day tables. LEGO is
-- the first supported subset and uses lego_id as the stable public identifier.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.bricks_header (
  id SERIAL PRIMARY KEY,
  subset TEXT NOT NULL,
  lego_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  tag TEXT,
  piece_count INTEGER,
  review_score NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.bricks_header
  ADD COLUMN IF NOT EXISTS subset TEXT,
  ADD COLUMN IF NOT EXISTS lego_id TEXT,
  ADD COLUMN IF NOT EXISTS set_name TEXT,
  ADD COLUMN IF NOT EXISTS tag TEXT,
  ADD COLUMN IF NOT EXISTS piece_count INTEGER,
  ADD COLUMN IF NOT EXISTS review_score NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.bricks_header
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.bricks_header
  ALTER COLUMN subset SET NOT NULL,
  ALTER COLUMN lego_id SET NOT NULL,
  ALTER COLUMN set_name SET NOT NULL,
  ALTER COLUMN review_score SET NOT NULL,
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
    WHERE conname = 'bricks_header_subset_lego_id_key'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_subset_lego_id_key
    UNIQUE (subset, lego_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_header_subset_check'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_subset_check
    CHECK (subset IN ('lego'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_header_lego_id_check'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_lego_id_check
    CHECK (BTRIM(lego_id) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_header_set_name_check'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_set_name_check
    CHECK (BTRIM(set_name) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_header_piece_count_check'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_piece_count_check
    CHECK (piece_count IS NULL OR piece_count >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_header_review_score_check'
      AND conrelid = 'dojo.bricks_header'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_header
    ADD CONSTRAINT bricks_header_review_score_check
    CHECK (review_score >= 1 AND review_score <= 10);
  END IF;
END
$$;

COMMENT ON TABLE dojo.bricks_header IS
  'Normalized bricks header metadata. LEGO is the initial subset and uses lego_id as the stable public identifier.';

COMMENT ON COLUMN dojo.bricks_header.subset IS
  'Bricks subset discriminator. LEGO is the current supported value.';

COMMENT ON COLUMN dojo.bricks_header.lego_id IS
  'Stable external LEGO set identifier passed from MDX ReleaseSection metadata and the public route.';

COMMENT ON COLUMN dojo.bricks_header.set_name IS
  'Display name for the LEGO set.';

COMMENT ON COLUMN dojo.bricks_header.tag IS
  'Optional normalized tag or theme label for the set.';

COMMENT ON COLUMN dojo.bricks_header.piece_count IS
  'Optional piece count for the set. When present it must be non-negative.';

COMMENT ON COLUMN dojo.bricks_header.review_score IS
  'Overall set score on a 1 to 10 scale. This score is stored once on the header regardless of build-day count.';

CREATE TABLE IF NOT EXISTS dojo.bricks_day (
  id SERIAL PRIMARY KEY,
  bricks_header_id INTEGER NOT NULL,
  build_date DATE NOT NULL,
  bags TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.bricks_day
  ADD COLUMN IF NOT EXISTS bricks_header_id INTEGER,
  ADD COLUMN IF NOT EXISTS build_date DATE,
  ADD COLUMN IF NOT EXISTS bags TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.bricks_day
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.bricks_day
  ALTER COLUMN bricks_header_id SET NOT NULL,
  ALTER COLUMN build_date SET NOT NULL,
  ALTER COLUMN bags SET NOT NULL,
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
    WHERE conname = 'bricks_day_bricks_header_id_fkey'
      AND conrelid = 'dojo.bricks_day'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_day
    ADD CONSTRAINT bricks_day_bricks_header_id_fkey
    FOREIGN KEY (bricks_header_id)
    REFERENCES dojo.bricks_header(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_day_header_build_date_key'
      AND conrelid = 'dojo.bricks_day'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_day
    ADD CONSTRAINT bricks_day_header_build_date_key
    UNIQUE (bricks_header_id, build_date);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bricks_day_bags_check'
      AND conrelid = 'dojo.bricks_day'::regclass
  ) THEN
    ALTER TABLE dojo.bricks_day
    ADD CONSTRAINT bricks_day_bags_check
    CHECK (BTRIM(bags) <> '');
  END IF;
END
$$;

COMMENT ON TABLE dojo.bricks_day IS
  'Per-build-day bricks metadata keyed to dojo.bricks_header. One row per set and build_date.';

COMMENT ON COLUMN dojo.bricks_day.bricks_header_id IS
  'Foreign key to the parent bricks header row.';

COMMENT ON COLUMN dojo.bricks_day.build_date IS
  'ISO build date used to reconnect chronicle narrative content to the correct build session.';

COMMENT ON COLUMN dojo.bricks_day.bags IS
  'Bag or bag-range label for the specific build session.';

CREATE INDEX IF NOT EXISTS idx_bricks_day_build_date_desc
ON dojo.bricks_day(build_date DESC);

CREATE INDEX IF NOT EXISTS idx_bricks_day_header_build_date_desc
ON dojo.bricks_day(bricks_header_id, build_date DESC);

DROP TRIGGER IF EXISTS trg_audit_bricks_header ON dojo.bricks_header;
CREATE TRIGGER trg_audit_bricks_header
BEFORE INSERT OR UPDATE ON dojo.bricks_header
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_bricks_day ON dojo.bricks_day;
CREATE TRIGGER trg_audit_bricks_day
BEFORE INSERT OR UPDATE ON dojo.bricks_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
