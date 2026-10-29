-- Review/approve before production. No historical migration rows are inserted.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $guard$
BEGIN
  IF current_database() <> 'tullyelly_db' OR current_user <> 'tullyelly_admin' THEN
    RAISE EXCEPTION 'Wrong database or role; verify the approved DataGrip host and branch';
  END IF;
  IF NOT pg_try_advisory_xact_lock(hashtextextended('cipher:schema-migrations', 0)) THEN
    RAISE EXCEPTION 'Another migration executor holds the release lock';
  END IF;
END;
$guard$;
DO $guard$
BEGIN
  IF to_regnamespace('dojo') IS NULL OR to_regclass('dojo.schema_migration') IS NOT NULL THEN
    RAISE EXCEPTION 'Expected existing dojo schema and absent ledger; inspect before retry';
  END IF;
END;
$guard$;
CREATE TABLE dojo.schema_migration (
  filename TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT NOT NULL DEFAULT 'sha256',
  status TEXT NOT NULL CHECK (status IN ('applied', 'failed')),
  applied_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_ms INTEGER,
  error_message TEXT,
  CONSTRAINT schema_migration_applied_at_check
    CHECK (status = 'failed' OR applied_at IS NOT NULL)
);

CREATE INDEX schema_migration_status_idx
  ON dojo.schema_migration (status);
COMMIT;
