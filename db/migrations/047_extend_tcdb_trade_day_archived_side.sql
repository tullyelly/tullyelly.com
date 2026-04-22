-- 047_extend_tcdb_trade_day_archived_side.sql
-- Allow archived TCDb trade days to close historical trades that only have
-- a received-side archive entry.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.tcdb_trade_day
  DROP CONSTRAINT IF EXISTS tcdb_trade_day_side_check;

ALTER TABLE dojo.tcdb_trade_day
  ADD CONSTRAINT tcdb_trade_day_side_check
  CHECK (side IN ('sent', 'received', 'archived'));

COMMENT ON COLUMN dojo.tcdb_trade_day.side IS
  'Which side of the transaction the ReleaseSection represents: sent, received, or archived.';

COMMIT;
