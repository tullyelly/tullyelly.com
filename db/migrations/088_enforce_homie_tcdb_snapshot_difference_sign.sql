-- Normalize existing differences before enforcing their sign by ranking.
-- Ranking 1 permits zero; all other rankings require a strictly negative value.
-- A zero outside ranking 1 becomes -1 because zero has no negative sign.
BEGIN;

-- Prevent concurrent writes between the correction and constraint installation.
LOCK TABLE dojo.homie_tcdb_snapshot IN ACCESS EXCLUSIVE MODE;

UPDATE dojo.homie_tcdb_snapshot
SET difference = CASE
    WHEN ranking = 1 THEN abs(difference::bigint)::integer
    WHEN difference = 0 THEN -1
    ELSE -difference
END
WHERE (ranking = 1 AND difference < 0)
   OR (ranking <> 1 AND difference >= 0);

-- Existing audit and realtime refresh triggers remain active for the correction.
-- An unrepresentable positive magnitude (integer minimum) aborts the transaction.
ALTER TABLE dojo.homie_tcdb_snapshot
    ADD CONSTRAINT homie_tcdb_snapshot_difference_sign_check
    CHECK (
        (ranking = 1 AND difference >= 0)
        OR (ranking <> 1 AND difference < 0)
    );

COMMIT;
