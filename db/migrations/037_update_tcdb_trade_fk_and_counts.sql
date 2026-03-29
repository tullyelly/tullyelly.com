-- 037_update_tcdb_trade_fk_and_counts.sql
-- Move tcdb_trade_day to the stable trade_id key, promote card counts to the
-- trade header, and reload both tables from the exported CSV snapshots.

SET search_path = dojo, auth, public;

BEGIN;

-- Disable audit triggers during the CSV reload so exported updated_* values
-- are preserved exactly as written in the snapshots.
DROP TRIGGER IF EXISTS trg_audit_tcdb_trade ON dojo.tcdb_trade;
DROP TRIGGER IF EXISTS trg_audit_tcdb_trade_day ON dojo.tcdb_trade_day;

ALTER TABLE dojo.tcdb_trade_day
  ADD COLUMN IF NOT EXISTS trade_id TEXT;

UPDATE dojo.tcdb_trade_day AS day
SET trade_id = trade.trade_id
FROM dojo.tcdb_trade AS trade
WHERE trade.id = day.tcdb_trade_id
  AND day.trade_id IS DISTINCT FROM trade.trade_id;

ALTER TABLE dojo.tcdb_trade
  ADD COLUMN IF NOT EXISTS sent INTEGER,
  ADD COLUMN IF NOT EXISTS received INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_sent_check'
      AND conrelid = 'dojo.tcdb_trade'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade
    ADD CONSTRAINT tcdb_trade_sent_check
    CHECK (sent IS NULL OR sent >= 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_received_check'
      AND conrelid = 'dojo.tcdb_trade'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade
    ADD CONSTRAINT tcdb_trade_received_check
    CHECK (received IS NULL OR received >= 0);
  END IF;
END
$$;

WITH trade_counts AS (
  SELECT
    day.trade_id,
    SUM(day.sent) AS sent,
    SUM(day.received) AS received
  FROM dojo.tcdb_trade_day AS day
  GROUP BY day.trade_id
)
UPDATE dojo.tcdb_trade AS trade
SET
  sent = trade_counts.sent,
  received = trade_counts.received
FROM trade_counts
WHERE trade.trade_id = trade_counts.trade_id;

ALTER TABLE dojo.tcdb_trade_day
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_tcdb_trade_id_fkey,
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_trade_id_date_key,
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_received_check,
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_sent_check;

DROP INDEX IF EXISTS dojo.idx_tcdb_trade_day_trade_id_date_desc;
DROP INDEX IF EXISTS dojo.idx_tcdb_trade_day_date_desc;

ALTER TABLE dojo.tcdb_trade_day
  ALTER COLUMN trade_id SET NOT NULL,
  DROP COLUMN IF EXISTS tcdb_trade_id,
  DROP COLUMN IF EXISTS received,
  DROP COLUMN IF EXISTS sent;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tcdb_trade_day_trade_id_fkey'
      AND conrelid = 'dojo.tcdb_trade_day'::regclass
  ) THEN
    ALTER TABLE dojo.tcdb_trade_day
    ADD CONSTRAINT tcdb_trade_day_trade_id_fkey
    FOREIGN KEY (trade_id)
    REFERENCES dojo.tcdb_trade(trade_id)
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
    UNIQUE (trade_id, trade_date);
  END IF;
END
$$;

COMMENT ON TABLE dojo.tcdb_trade IS
  'Normalized TCDb trade metadata keyed by the stable ReleaseSection tcdbTradeId value.';

COMMENT ON COLUMN dojo.tcdb_trade.trade_id IS
  'Stable external trade identifier passed from MDX and ReleaseSection as tcdbTradeId.';

COMMENT ON COLUMN dojo.tcdb_trade.partner IS
  'Optional TCDb partner profile identifier associated with the public trade_id.';

COMMENT ON COLUMN dojo.tcdb_trade.sent IS
  'Optional aggregate sent card count across all recorded rows for the trade.';

COMMENT ON COLUMN dojo.tcdb_trade.received IS
  'Optional aggregate received card count across all recorded rows for the trade.';

COMMENT ON TABLE dojo.tcdb_trade_day IS
  'Per-day TCDb trade metadata keyed by the stable trade_id; aggregate card counts live on dojo.tcdb_trade.';

COMMENT ON COLUMN dojo.tcdb_trade_day.trade_id IS
  'Foreign key to dojo.tcdb_trade.trade_id using the stable public trade identifier.';

COMMENT ON COLUMN dojo.tcdb_trade_day.trade_date IS
  'ISO-date backed ReleaseSection trade day; one row per trade and trade_date.';

COMMENT ON COLUMN dojo.tcdb_trade_day.side IS
  'Which side of the transaction the ReleaseSection represents: sent or received.';

CREATE TEMP TABLE tcdb_trade_stage (
  id INTEGER NOT NULL,
  trade_id TEXT NOT NULL,
  partner TEXT,
  created_at TIMESTAMPTZ,
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
) ON COMMIT DROP;

-- The day export is expected to match the previous table order:
-- id, tcdb_trade_id, trade_date, side, received, sent, created_at, created_by,
-- updated_at, updated_by.
CREATE TEMP TABLE tcdb_trade_day_stage (
  id INTEGER NOT NULL,
  header_id INTEGER NOT NULL,
  trade_date DATE NOT NULL,
  side TEXT NOT NULL,
  received INTEGER,
  sent INTEGER,
  created_at TIMESTAMPTZ,
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
) ON COMMIT DROP;

-- Snapshot source:
-- public/images/source/tullyelly_db_dojo_tcdb_trade.csv
-- public/images/source/tullyelly_db_dojo_tcdb_trade_day.csv
INSERT INTO tcdb_trade_stage (
  id,
  trade_id,
  partner,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES
  (1, '946574', 'Tyrese-haliburton0', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (2, '960943', 'Jeff Skinner', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (3, '961193', 'ss2535', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (4, '962086', 'bballcardfan', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (5, '962459', 'Amagee', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (6, '963185', 'Aaron_miller', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (7, '964402', 'Toddbwd', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (8, '964763', 'Jones1976', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (9, '965997', 'OkayFolks', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (10, '967415', 'nkandy11', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (11, '970598', 'Madding', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (12, '970604', 'Fido', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (13, '971289', 'rustypetty', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (14, '994232', 'jbostic', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (15, '996974', 'DukeyDevil', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (16, '997119', 'JBarbs80', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (17, '998617', 'JBsSetCollection', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (18, '998705', 'Carburner', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (19, '1000146', 'mastodon', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (20, '1001130', 'jamestagli', TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (21, '999032', 'rob hammond', TIMESTAMPTZ '2026-03-29 02:45:25.964278 +00:00', 'tullyelly_admin', NULL, NULL);

INSERT INTO tcdb_trade_day_stage (
  id,
  header_id,
  trade_date,
  side,
  received,
  sent,
  created_at,
  created_by,
  updated_at,
  updated_by
)
VALUES
  (1, 1, DATE '2026-03-04', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (2, 1, DATE '2026-01-28', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (3, 2, DATE '2026-01-31', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (4, 2, DATE '2026-01-24', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (5, 3, DATE '2026-03-12', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (6, 3, DATE '2026-01-27', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (7, 4, DATE '2026-02-19', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (8, 4, DATE '2026-01-27', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (9, 5, DATE '2026-02-17', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (10, 5, DATE '2026-01-28', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (11, 6, DATE '2026-02-12', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (12, 6, DATE '2026-01-29', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (13, 7, DATE '2026-02-04', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (14, 7, DATE '2026-02-01', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (15, 8, DATE '2026-03-05', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (16, 8, DATE '2026-02-01', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (17, 9, DATE '2026-03-07', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (18, 9, DATE '2026-02-13', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (19, 10, DATE '2026-02-11', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (20, 10, DATE '2026-02-01', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (21, 11, DATE '2026-02-21', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (22, 11, DATE '2026-02-08', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (23, 12, DATE '2026-02-12', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (24, 12, DATE '2026-02-08', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (25, 13, DATE '2026-03-02', 'received', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (26, 13, DATE '2026-02-08', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (27, 14, DATE '2026-03-17', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (28, 15, DATE '2026-03-25', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (29, 16, DATE '2026-03-19', 'sent', 20, 19, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (30, 17, DATE '2026-03-24', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (31, 18, DATE '2026-03-23', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (32, 19, DATE '2026-03-25', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (33, 20, DATE '2026-03-26', 'sent', NULL, NULL, TIMESTAMPTZ '2026-03-28 00:50:34.248382 +00:00', 'tullyelly_admin', NULL, NULL),
  (34, 21, DATE '2026-03-28', 'sent', 118, 118, TIMESTAMPTZ '2026-03-29 02:46:59.397475 +00:00', 'tullyelly_admin', NULL, NULL);

TRUNCATE TABLE dojo.tcdb_trade_day, dojo.tcdb_trade RESTART IDENTITY;

INSERT INTO dojo.tcdb_trade (
  id,
  trade_id,
  partner,
  created_at,
  created_by,
  updated_at,
  updated_by,
  sent,
  received
)
SELECT
  stage.id,
  stage.trade_id,
  NULLIF(stage.partner, ''),
  COALESCE(stage.created_at, CURRENT_TIMESTAMP),
  COALESCE(NULLIF(stage.created_by, ''), CURRENT_USER),
  stage.updated_at,
  NULLIF(stage.updated_by, ''),
  trade_counts.sent,
  trade_counts.received
FROM tcdb_trade_stage AS stage
LEFT JOIN (
  SELECT
    day_stage.header_id,
    SUM(day_stage.sent) AS sent,
    SUM(day_stage.received) AS received
  FROM tcdb_trade_day_stage AS day_stage
  GROUP BY day_stage.header_id
) AS trade_counts
  ON trade_counts.header_id = stage.id
ORDER BY stage.id;

INSERT INTO dojo.tcdb_trade_day (
  id,
  trade_id,
  trade_date,
  side,
  created_at,
  created_by,
  updated_at,
  updated_by
)
SELECT
  day_stage.id,
  trade.trade_id,
  day_stage.trade_date,
  day_stage.side,
  COALESCE(day_stage.created_at, CURRENT_TIMESTAMP),
  COALESCE(NULLIF(day_stage.created_by, ''), CURRENT_USER),
  day_stage.updated_at,
  NULLIF(day_stage.updated_by, '')
FROM tcdb_trade_day_stage AS day_stage
JOIN dojo.tcdb_trade AS trade
  ON trade.id = day_stage.header_id
ORDER BY day_stage.id;

SELECT setval(
  pg_get_serial_sequence('dojo.tcdb_trade', 'id'),
  COALESCE((SELECT MAX(id) FROM dojo.tcdb_trade), 1),
  COALESCE((SELECT MAX(id) FROM dojo.tcdb_trade), 0) > 0
);

SELECT setval(
  pg_get_serial_sequence('dojo.tcdb_trade_day', 'id'),
  COALESCE((SELECT MAX(id) FROM dojo.tcdb_trade_day), 1),
  COALESCE((SELECT MAX(id) FROM dojo.tcdb_trade_day), 0) > 0
);

CREATE INDEX IF NOT EXISTS idx_tcdb_trade_day_date_desc
ON dojo.tcdb_trade_day(trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_tcdb_trade_day_trade_id_date_desc
ON dojo.tcdb_trade_day(trade_id, trade_date DESC);

CREATE TRIGGER trg_audit_tcdb_trade
BEFORE INSERT OR UPDATE ON dojo.tcdb_trade
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

CREATE TRIGGER trg_audit_tcdb_trade_day
BEFORE INSERT OR UPDATE ON dojo.tcdb_trade_day
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
