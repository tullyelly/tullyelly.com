-- 042_create_set_collector_tables.sql
-- Normalize tracked card-set progress into shared header and snapshot tables.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.set_collector_header (
  id SERIAL PRIMARY KEY,
  set_name TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  manufacturer TEXT NOT NULL,
  tcdb_set_url TEXT NOT NULL,
  completed_set_photo_path TEXT,
  category_tag TEXT,
  rating NUMERIC(4,2),
  total_cards INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.set_collector_header
  ADD COLUMN IF NOT EXISTS set_name TEXT,
  ADD COLUMN IF NOT EXISTS release_year INTEGER,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS tcdb_set_url TEXT,
  ADD COLUMN IF NOT EXISTS completed_set_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS category_tag TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS total_cards INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.set_collector_header
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.set_collector_header
  ALTER COLUMN set_name SET NOT NULL,
  ALTER COLUMN release_year SET NOT NULL,
  ALTER COLUMN manufacturer SET NOT NULL,
  ALTER COLUMN tcdb_set_url SET NOT NULL,
  ALTER COLUMN completed_set_photo_path DROP NOT NULL,
  ALTER COLUMN rating DROP NOT NULL,
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
    WHERE conname = 'set_collector_header_tcdb_set_url_key'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_tcdb_set_url_key
    UNIQUE (tcdb_set_url);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_set_name_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_set_name_check
    CHECK (BTRIM(set_name) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_release_year_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_release_year_check
    CHECK (release_year >= 1800 AND release_year <= 9999);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_manufacturer_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_manufacturer_check
    CHECK (BTRIM(manufacturer) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_tcdb_set_url_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_tcdb_set_url_check
    CHECK (BTRIM(tcdb_set_url) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_completed_set_photo_path_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    DROP CONSTRAINT set_collector_header_completed_set_photo_path_check;
  END IF;

  ALTER TABLE dojo.set_collector_header
  ADD CONSTRAINT set_collector_header_completed_set_photo_path_check
  CHECK (
    completed_set_photo_path IS NULL
    OR BTRIM(completed_set_photo_path) <> ''
  );
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_category_tag_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_category_tag_check
    CHECK (category_tag IS NULL OR BTRIM(category_tag) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_rating_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    DROP CONSTRAINT set_collector_header_rating_check;
  END IF;

  ALTER TABLE dojo.set_collector_header
  ADD CONSTRAINT set_collector_header_rating_check
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10));
END
$$;

COMMENT ON TABLE dojo.set_collector_header IS
  'Tracked card-set headers keyed by an auto-generated numeric id used as the public route identifier.';

COMMENT ON COLUMN dojo.set_collector_header.id IS
  'Auto-generated public route id for the Set Collector detail page and MDX embeds.';

COMMENT ON COLUMN dojo.set_collector_header.set_name IS
  'Display name for the tracked card set.';

COMMENT ON COLUMN dojo.set_collector_header.release_year IS
  'Release year for the tracked card set.';

COMMENT ON COLUMN dojo.set_collector_header.manufacturer IS
  'Card manufacturer associated with the tracked set.';

COMMENT ON COLUMN dojo.set_collector_header.tcdb_set_url IS
  'Canonical TCDb set URL for the tracked set.';

COMMENT ON COLUMN dojo.set_collector_header.completed_set_photo_path IS
  'Optional app route or asset path for the completed set photo shown on the detail page once a set is complete.';

COMMENT ON COLUMN dojo.set_collector_header.category_tag IS
  'Optional category or theme tag for the tracked set.';

COMMENT ON COLUMN dojo.set_collector_header.rating IS
  'Optional overall set rating on a 1 to 10 scale; decimals are allowed.';

COMMENT ON COLUMN dojo.set_collector_header.total_cards IS
  'Static card total needed to complete the tracked set.';

CREATE TABLE IF NOT EXISTS dojo.set_collector_snapshot (
  id SERIAL PRIMARY KEY,
  set_collector_header_id INTEGER NOT NULL,
  snapshot_date DATE NOT NULL,
  cards_owned INTEGER NOT NULL,
  tcdb_trade_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.set_collector_snapshot
  ADD COLUMN IF NOT EXISTS set_collector_header_id INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_date DATE,
  ADD COLUMN IF NOT EXISTS cards_owned INTEGER,
  ADD COLUMN IF NOT EXISTS tcdb_trade_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.set_collector_snapshot
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.set_collector_snapshot
  ALTER COLUMN set_collector_header_id SET NOT NULL,
  ALTER COLUMN snapshot_date SET NOT NULL,
  ALTER COLUMN cards_owned SET NOT NULL,
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
    WHERE conname = 'set_collector_snapshot_header_id_fkey'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    ADD CONSTRAINT set_collector_snapshot_header_id_fkey
    FOREIGN KEY (set_collector_header_id)
    REFERENCES dojo.set_collector_header(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_snapshot_tcdb_trade_id_fkey'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    ADD CONSTRAINT set_collector_snapshot_tcdb_trade_id_fkey
    FOREIGN KEY (tcdb_trade_id)
    REFERENCES dojo.tcdb_trade(trade_id)
    ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_snapshot_header_date_key'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    ADD CONSTRAINT set_collector_snapshot_header_date_key
    UNIQUE (set_collector_header_id, snapshot_date);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'dojo'
      AND table_name = 'set_collector_snapshot'
      AND column_name = 'total_cards'
  ) THEN
    UPDATE dojo.set_collector_header AS header
       SET total_cards = latest.total_cards
      FROM (
        SELECT DISTINCT ON (snapshot.set_collector_header_id)
          snapshot.set_collector_header_id,
          snapshot.total_cards
        FROM dojo.set_collector_snapshot AS snapshot
        WHERE snapshot.total_cards IS NOT NULL
        ORDER BY
          snapshot.set_collector_header_id,
          snapshot.snapshot_date DESC,
          snapshot.id DESC
      ) AS latest
     WHERE header.id = latest.set_collector_header_id
       AND header.total_cards IS NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM dojo.set_collector_header
    WHERE total_cards IS NULL
  ) THEN
    RAISE EXCEPTION
      'Set Collector migration requires header.total_cards for every set. Backfill missing totals before re-running migration 042.';
  END IF;
END
$$;

ALTER TABLE dojo.set_collector_header
  ALTER COLUMN total_cards SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_total_cards_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_total_cards_check
    CHECK (total_cards > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_snapshot_cards_owned_check'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    ADD CONSTRAINT set_collector_snapshot_cards_owned_check
    CHECK (cards_owned >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_snapshot_total_cards_check'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    DROP CONSTRAINT set_collector_snapshot_total_cards_check;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_snapshot_progress_check'
      AND conrelid = 'dojo.set_collector_snapshot'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_snapshot
    DROP CONSTRAINT set_collector_snapshot_progress_check;
  END IF;
END
$$;

ALTER TABLE dojo.set_collector_snapshot
  DROP COLUMN IF EXISTS total_cards;

COMMENT ON TABLE dojo.set_collector_snapshot IS
  'Per-day Set Collector progress keyed to dojo.set_collector_header. One row per set and snapshot_date.';

COMMENT ON COLUMN dojo.set_collector_snapshot.set_collector_header_id IS
  'Foreign key to the parent tracked card-set header.';

COMMENT ON COLUMN dojo.set_collector_snapshot.snapshot_date IS
  'ISO snapshot date for recorded set progress.';

COMMENT ON COLUMN dojo.set_collector_snapshot.cards_owned IS
  'How many cards were owned on the snapshot date.';

COMMENT ON COLUMN dojo.set_collector_snapshot.tcdb_trade_id IS
  'Optional link to a single existing dojo.tcdb_trade.trade_id that affected this snapshot.';

CREATE OR REPLACE FUNCTION dojo.validate_set_collector_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_cards INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'set_collector_header' THEN
    IF NEW.total_cards IS NULL OR NEW.total_cards <= 0 THEN
      RAISE EXCEPTION
        'Set Collector header total_cards must be a positive integer.';
    END IF;

    IF NEW.id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM dojo.set_collector_snapshot AS snapshot
      WHERE snapshot.set_collector_header_id = NEW.id
        AND snapshot.cards_owned > NEW.total_cards
    ) THEN
      RAISE EXCEPTION
        'Set Collector header total_cards (%) cannot be less than existing cards_owned values for set %.',
        NEW.total_cards,
        NEW.id;
    END IF;

    RETURN NEW;
  END IF;

  SELECT header.total_cards
    INTO v_total_cards
    FROM dojo.set_collector_header AS header
   WHERE header.id = NEW.set_collector_header_id;

  IF v_total_cards IS NULL THEN
    RAISE EXCEPTION
      'Set Collector snapshot header % is missing total_cards.',
      NEW.set_collector_header_id;
  END IF;

  IF NEW.cards_owned > v_total_cards THEN
    RAISE EXCEPTION
      'Set Collector snapshot cards_owned (%) cannot exceed header total_cards (%) for set %.',
      NEW.cards_owned,
      v_total_cards,
      NEW.set_collector_header_id;
  END IF;

  RETURN NEW;
END
$$;

CREATE INDEX IF NOT EXISTS idx_set_collector_header_release_year_desc
ON dojo.set_collector_header(release_year DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_set_collector_snapshot_date_desc
ON dojo.set_collector_snapshot(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_set_collector_snapshot_header_date_desc
ON dojo.set_collector_snapshot(set_collector_header_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_set_collector_snapshot_trade_id
ON dojo.set_collector_snapshot(tcdb_trade_id)
WHERE tcdb_trade_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_validate_set_collector_header_counts
ON dojo.set_collector_header;
CREATE TRIGGER trg_validate_set_collector_header_counts
BEFORE INSERT OR UPDATE ON dojo.set_collector_header
FOR EACH ROW
EXECUTE FUNCTION dojo.validate_set_collector_progress();

DROP TRIGGER IF EXISTS trg_validate_set_collector_snapshot_counts
ON dojo.set_collector_snapshot;
CREATE TRIGGER trg_validate_set_collector_snapshot_counts
BEFORE INSERT OR UPDATE ON dojo.set_collector_snapshot
FOR EACH ROW
EXECUTE FUNCTION dojo.validate_set_collector_progress();

DROP TRIGGER IF EXISTS trg_audit_set_collector_header
ON dojo.set_collector_header;
CREATE TRIGGER trg_audit_set_collector_header
BEFORE INSERT OR UPDATE ON dojo.set_collector_header
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_set_collector_snapshot
ON dojo.set_collector_snapshot;
CREATE TRIGGER trg_audit_set_collector_snapshot
BEFORE INSERT OR UPDATE ON dojo.set_collector_snapshot
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
