-- 036_create_tcdb_trade_tables.sql
-- Normalize ReleaseSection TCDb trade metadata into trade header and day tables.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.tcdb_trade (
  id SERIAL PRIMARY KEY,
  trade_id TEXT NOT NULL,
  partner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.tcdb_trade
  ADD COLUMN IF NOT EXISTS trade_id TEXT,
  ADD COLUMN IF NOT EXISTS partner TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.tcdb_trade
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.tcdb_trade
  ALTER COLUMN trade_id SET NOT NULL,
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
    WHERE conname = 'tcdb_trade_trade_id_key'
      AND conrelid = 'dojo.tcdb_trade'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade
    ADD CONSTRAINT tcdb_trade_trade_id_key
    UNIQUE (trade_id);
  END IF;
END
$$;

COMMENT ON TABLE dojo.tcdb_trade IS
  'Normalized TCDb trade metadata keyed by the stable ReleaseSection tcdbTradeId value.';

COMMENT ON COLUMN dojo.tcdb_trade.trade_id IS
  'Stable external trade identifier passed from MDX and ReleaseSection as tcdbTradeId.';

COMMENT ON COLUMN dojo.tcdb_trade.partner IS
  'Optional TCDb partner profile identifier associated with the public trade_id.';

CREATE TABLE IF NOT EXISTS dojo.tcdb_trade_day (
  id SERIAL PRIMARY KEY,
  tcdb_trade_id INTEGER NOT NULL,
  trade_date DATE NOT NULL,
  side TEXT NOT NULL,
  received INTEGER,
  sent INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.tcdb_trade_day
  ADD COLUMN IF NOT EXISTS tcdb_trade_id INTEGER,
  ADD COLUMN IF NOT EXISTS trade_date DATE,
  ADD COLUMN IF NOT EXISTS side TEXT,
  ADD COLUMN IF NOT EXISTS received INTEGER,
  ADD COLUMN IF NOT EXISTS sent INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.tcdb_trade_day
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.tcdb_trade_day
  ALTER COLUMN tcdb_trade_id SET NOT NULL,
  ALTER COLUMN trade_date SET NOT NULL,
  ALTER COLUMN side SET NOT NULL,
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
    WHERE conname = 'tcdb_trade_day_tcdb_trade_id_fkey'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_tcdb_trade_id_fkey
    FOREIGN KEY (tcdb_trade_id)
    REFERENCES dojo.tcdb_trade(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_day_trade_id_date_key'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_trade_id_date_key
    UNIQUE (tcdb_trade_id, trade_date);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_day_side_check'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_side_check
    CHECK (side IN ('sent', 'received'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_day_received_check'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_received_check
    CHECK (received IS NULL OR received >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_day_sent_check'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_sent_check
    CHECK (sent IS NULL OR sent >= 0);
  END IF;
END
$$;

COMMENT ON TABLE dojo.tcdb_trade_day IS
  'Per-day TCDb trade metadata with one row for each trade_id plus trade_date combination.';

COMMENT ON COLUMN dojo.tcdb_trade_day.tcdb_trade_id IS
  'Foreign key to the parent TCDb trade header record.';

COMMENT ON COLUMN dojo.tcdb_trade_day.trade_date IS
  'ISO-date backed ReleaseSection trade day; one row per trade and trade_date.';

COMMENT ON COLUMN dojo.tcdb_trade_day.side IS
  'Which side of the transaction the ReleaseSection represents: sent or received.';

COMMENT ON COLUMN dojo.tcdb_trade_day.received IS
  'Optional received card count for the specific trade day.';

COMMENT ON COLUMN dojo.tcdb_trade_day.sent IS
  'Optional sent card count for the specific trade day.';

CREATE INDEX IF NOT EXISTS idx_tcdb_trade_day_date_desc
ON dojo.tcdb_trade_day(trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_tcdb_trade_day_trade_id_date_desc
ON dojo.tcdb_trade_day(tcdb_trade_id, trade_date DESC);

DROP TRIGGER IF EXISTS trg_audit_tcdb_trade ON dojo.tcdb_trade;
CREATE TRIGGER trg_audit_tcdb_trade
BEFORE INSERT OR UPDATE ON dojo.tcdb_trade
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_tcdb_trade_day ON dojo.tcdb_trade_day;
CREATE TRIGGER trg_audit_tcdb_trade_day
BEFORE INSERT OR UPDATE ON dojo.tcdb_trade_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

-- Backfill current ReleaseSection trade metadata from chronicles.
INSERT INTO dojo.tcdb_trade (trade_id, partner)
VALUES
  ('946574', 'Tyrese-haliburton0'),
  ('960943', 'Jeff Skinner'),
  ('961193', 'ss2535'),
  ('962086', 'bballcardfan'),
  ('962459', 'Amagee'),
  ('963185', 'Aaron_miller'),
  ('964402', 'Toddbwd'),
  ('964763', 'Jones1976'),
  ('965997', 'OkayFolks'),
  ('967415', 'nkandy11'),
  ('970598', 'Madding'),
  ('970604', 'Fido'),
  ('971289', 'rustypetty'),
  ('994232', 'jbostic'),
  ('996974', 'DukeyDevil'),
  ('997119', 'JBarbs80'),
  ('998617', 'JBsSetCollection'),
  ('998705', 'Carburner'),
  ('1000146', 'mastodon'),
  ('1001130', 'jamestagli')
ON CONFLICT (trade_id) DO UPDATE
SET partner = EXCLUDED.partner;

WITH trade_day_seed (trade_id, trade_date, side, received, sent) AS (
  VALUES
    ('946574', DATE '2026-01-28', 'sent', NULL, NULL),
    ('946574', DATE '2026-03-04', 'received', NULL, NULL),
    ('960943', DATE '2026-01-24', 'sent', NULL, NULL),
    ('960943', DATE '2026-01-31', 'received', NULL, NULL),
    ('961193', DATE '2026-01-27', 'sent', NULL, NULL),
    ('961193', DATE '2026-03-12', 'received', NULL, NULL),
    ('962086', DATE '2026-01-27', 'sent', NULL, NULL),
    ('962086', DATE '2026-02-19', 'received', NULL, NULL),
    ('962459', DATE '2026-01-28', 'sent', NULL, NULL),
    ('962459', DATE '2026-02-17', 'received', NULL, NULL),
    ('963185', DATE '2026-01-29', 'sent', NULL, NULL),
    ('963185', DATE '2026-02-12', 'received', NULL, NULL),
    ('964402', DATE '2026-02-01', 'sent', NULL, NULL),
    ('964402', DATE '2026-02-04', 'received', NULL, NULL),
    ('964763', DATE '2026-02-01', 'sent', NULL, NULL),
    ('964763', DATE '2026-03-05', 'received', NULL, NULL),
    ('965997', DATE '2026-02-13', 'sent', NULL, NULL),
    ('965997', DATE '2026-03-07', 'received', NULL, NULL),
    ('967415', DATE '2026-02-01', 'sent', NULL, NULL),
    ('967415', DATE '2026-02-11', 'received', NULL, NULL),
    ('970598', DATE '2026-02-08', 'sent', NULL, NULL),
    ('970598', DATE '2026-02-21', 'received', NULL, NULL),
    ('970604', DATE '2026-02-08', 'sent', NULL, NULL),
    ('970604', DATE '2026-02-12', 'received', NULL, NULL),
    ('971289', DATE '2026-02-08', 'sent', NULL, NULL),
    ('971289', DATE '2026-03-02', 'received', NULL, NULL),
    ('994232', DATE '2026-03-17', 'sent', NULL, NULL),
    ('996974', DATE '2026-03-25', 'sent', NULL, NULL),
    ('997119', DATE '2026-03-19', 'sent', 20, 19),
    ('998617', DATE '2026-03-24', 'sent', NULL, NULL),
    ('998705', DATE '2026-03-23', 'sent', NULL, NULL),
    ('1000146', DATE '2026-03-25', 'sent', NULL, NULL),
    ('1001130', DATE '2026-03-26', 'sent', NULL, NULL)
)
INSERT INTO dojo.tcdb_trade_day (
  tcdb_trade_id,
  trade_date,
  side,
  received,
  sent
)
SELECT
  trade.id,
  trade_day_seed.trade_date,
  trade_day_seed.side,
  trade_day_seed.received,
  trade_day_seed.sent
FROM trade_day_seed
JOIN dojo.tcdb_trade AS trade
  ON trade.trade_id = trade_day_seed.trade_id
ON CONFLICT (tcdb_trade_id, trade_date) DO UPDATE
SET
  side = EXCLUDED.side,
  received = EXCLUDED.received,
  sent = EXCLUDED.sent;

COMMIT;
