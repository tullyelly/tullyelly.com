-- Allow a TCDb trade to record distinct sent and received events on the same
-- date while continuing to reject duplicate entries for the same side.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.tcdb_trade_day
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_trade_id_date_key;

ALTER TABLE dojo.tcdb_trade_day
  ADD CONSTRAINT tcdb_trade_day_trade_id_date_side_key
  UNIQUE (trade_id, trade_date, side);

COMMENT ON TABLE dojo.tcdb_trade_day IS
  'Per-day TCDb trade metadata keyed by trade, date, and side; aggregate card counts live on dojo.tcdb_trade.';

COMMENT ON COLUMN dojo.tcdb_trade_day.trade_date IS
  'ISO-date backed ReleaseSection trade day; sent and received may each occur once per trade on the same date.';

COMMIT;
