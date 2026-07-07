-- 061_relax_volleyball_finish_constraint.sql
-- Allow volleyball tournament finish to store any integer placing.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.volleyball_tournament
  DROP CONSTRAINT IF EXISTS volleyball_tournament_finish_check;

COMMENT ON COLUMN dojo.volleyball_tournament.finish IS
  'Optional integer placing for the tournament run; NULL when no tracked placing is available.';

COMMIT;
