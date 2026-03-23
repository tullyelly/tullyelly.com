-- 035_add_finish_to_volleyball_tournament.sql
-- Add podium finish metadata to dojo.volleyball_tournament.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.volleyball_tournament
  ADD COLUMN IF NOT EXISTS finish INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'volleyball_tournament_finish_check'
      AND conrelid = 'dojo.volleyball_tournament'::regclass
  ) THEN
    ALTER TABLE dojo.volleyball_tournament
    ADD CONSTRAINT volleyball_tournament_finish_check
    CHECK (finish IS NULL OR finish IN (1, 2, 3));
  END IF;
END
$$;

COMMENT ON COLUMN dojo.volleyball_tournament.finish IS
  'Optional podium finish for the tournament run; NULL when no tracked placing is available.';

UPDATE dojo.volleyball_tournament
SET finish = 1
WHERE tournament_key = '2'
  AND finish IS DISTINCT FROM 1;

COMMIT;
