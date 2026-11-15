-- JAMES ONLY, existing DEVELOPMENT console B while A holds its transaction.
-- Expected: wait for A's commit, then reserved-tag exception; INSERT rolls back.
-- If it succeeds or deadlocks, ROLLBACK and stop; do not claim a passing test.
BEGIN;
SET LOCAL lock_timeout='45s';
SET LOCAL statement_timeout='55s';
INSERT INTO dojo.homie(id,name,tag_slug,drafted) OVERRIDING SYSTEM VALUE
VALUES(-1261002,'WU-1261 concurrency fixture','wu-1261-concurrency-fixture',2000);
ROLLBACK;
-- After expected exception, run ROLLBACK explicitly if DataGrip stopped execution.
