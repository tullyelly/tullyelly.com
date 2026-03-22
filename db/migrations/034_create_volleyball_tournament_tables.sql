-- 034_create_volleyball_tournament_tables.sql
-- Normalize ReleaseSection volleyball tournament metadata into tournament header and day tables.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.volleyball_tournament (
  id SERIAL PRIMARY KEY,
  tournament_key TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.volleyball_tournament
  ADD COLUMN IF NOT EXISTS tournament_key TEXT,
  ADD COLUMN IF NOT EXISTS tournament_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.volleyball_tournament
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.volleyball_tournament
  ALTER COLUMN tournament_key SET NOT NULL,
  ALTER COLUMN tournament_name SET NOT NULL,
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
    WHERE conname = 'volleyball_tournament_tournament_key_key'
      AND conrelid = 'dojo.volleyball_tournament'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament
    ADD CONSTRAINT volleyball_tournament_tournament_key_key
    UNIQUE (tournament_key);
  END IF;
END
$$;

COMMENT ON TABLE dojo.volleyball_tournament IS
  'Normalized volleyball tournament metadata keyed by the stable ReleaseSection tournamentId value.';

COMMENT ON COLUMN dojo.volleyball_tournament.tournament_key IS
  'Stable external tournament key passed from MDX and ReleaseSection as tournamentId.';

COMMENT ON COLUMN dojo.volleyball_tournament.tournament_name IS
  'Display name for the volleyball tournament associated with the stable tournament key.';

CREATE TABLE IF NOT EXISTS dojo.volleyball_tournament_day (
  id SERIAL PRIMARY KEY,
  volleyball_tournament_id INTEGER NOT NULL,
  tournament_date DATE NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.volleyball_tournament_day
  ADD COLUMN IF NOT EXISTS volleyball_tournament_id INTEGER,
  ADD COLUMN IF NOT EXISTS tournament_date DATE,
  ADD COLUMN IF NOT EXISTS wins INTEGER,
  ADD COLUMN IF NOT EXISTS losses INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.volleyball_tournament_day
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.volleyball_tournament_day
  ALTER COLUMN volleyball_tournament_id SET NOT NULL,
  ALTER COLUMN tournament_date SET NOT NULL,
  ALTER COLUMN wins SET NOT NULL,
  ALTER COLUMN losses SET NOT NULL,
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
    WHERE conname = 'volleyball_tournament_day_volleyball_tournament_id_fkey'
      AND conrelid = 'dojo.volleyball_tournament_day'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament_day
    ADD CONSTRAINT volleyball_tournament_day_volleyball_tournament_id_fkey
    FOREIGN KEY (volleyball_tournament_id)
    REFERENCES dojo.volleyball_tournament(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volleyball_tournament_day_tournament_id_date_key'
      AND conrelid = 'dojo.volleyball_tournament_day'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament_day
    ADD CONSTRAINT volleyball_tournament_day_tournament_id_date_key
    UNIQUE (volleyball_tournament_id, tournament_date);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volleyball_tournament_day_wins_check'
      AND conrelid = 'dojo.volleyball_tournament_day'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament_day
    ADD CONSTRAINT volleyball_tournament_day_wins_check
    CHECK (wins >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volleyball_tournament_day_losses_check'
      AND conrelid = 'dojo.volleyball_tournament_day'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament_day
    ADD CONSTRAINT volleyball_tournament_day_losses_check
    CHECK (losses >= 0);
  END IF;
END
$$;

COMMENT ON TABLE dojo.volleyball_tournament_day IS
  'Per-day volleyball tournament results with one ISO-date-backed row for each tournament day.';

COMMENT ON COLUMN dojo.volleyball_tournament_day.volleyball_tournament_id IS
  'Foreign key to the parent volleyball tournament header record.';

COMMENT ON COLUMN dojo.volleyball_tournament_day.tournament_date IS
  'ISO-date backed tournament day; one row per tournament day.';

COMMENT ON COLUMN dojo.volleyball_tournament_day.wins IS
  'Numeric tournament-day wins; the UI reconstructs the W-L string.';

COMMENT ON COLUMN dojo.volleyball_tournament_day.losses IS
  'Numeric tournament-day losses; the UI reconstructs the W-L string.';

CREATE INDEX IF NOT EXISTS idx_volleyball_tournament_day_date_desc
ON dojo.volleyball_tournament_day(tournament_date DESC);

CREATE INDEX IF NOT EXISTS idx_volleyball_tournament_day_tournament_id_date_desc
ON dojo.volleyball_tournament_day(volleyball_tournament_id, tournament_date DESC);

DROP TRIGGER IF EXISTS trg_audit_volleyball_tournament ON dojo.volleyball_tournament;
CREATE TRIGGER trg_audit_volleyball_tournament
BEFORE INSERT OR UPDATE ON dojo.volleyball_tournament
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_volleyball_tournament_day ON dojo.volleyball_tournament_day;
CREATE TRIGGER trg_audit_volleyball_tournament_day
BEFORE INSERT OR UPDATE ON dojo.volleyball_tournament_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

-- Backfill existing ReleaseSection tournament metadata from current chronicles.
INSERT INTO dojo.volleyball_tournament (tournament_key, tournament_name)
VALUES
  ('1', 'Midwest Boys Point Series'),
  ('2', 'Dale Rohde Tournament'),
  ('3', 'Badger Region Championships')
ON CONFLICT (tournament_key) DO UPDATE
SET tournament_name = EXCLUDED.tournament_name;

WITH tournament_day_seed (tournament_key, tournament_date, wins, losses) AS (
  VALUES
    ('1', DATE '2026-02-14', 2, 1),
    ('1', DATE '2026-02-15', 0, 2),
    ('2', DATE '2026-02-21', 3, 0),
    ('2', DATE '2026-02-22', 3, 0),
    ('3', DATE '2026-03-21', 3, 0)
)
INSERT INTO dojo.volleyball_tournament_day (
  volleyball_tournament_id,
  tournament_date,
  wins,
  losses
)
SELECT
  tournament.id,
  tournament_day_seed.tournament_date,
  tournament_day_seed.wins,
  tournament_day_seed.losses
FROM tournament_day_seed
JOIN dojo.volleyball_tournament AS tournament
  ON tournament.tournament_key = tournament_day_seed.tournament_key
ON CONFLICT (volleyball_tournament_id, tournament_date) DO UPDATE
SET
  wins = EXCLUDED.wins,
  losses = EXCLUDED.losses;

COMMIT;
