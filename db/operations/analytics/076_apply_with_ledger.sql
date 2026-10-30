-- Operational bundle; original migration body below is unchanged.
-- Ledger checksum identifies the original file, not this reviewed bundle.
-- Aggregate production traffic only; no visitor identifiers or raw events.
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
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '076_create_analytics_archive.sql') THEN
    RAISE EXCEPTION 'Selected ledger row already exists; inspect, do not replay';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='dojo' AND c.relname IN
    ('analytics_run','analytics_run_id_seq','analytics_progress','analytics_day','analytics_page_day','analytics_stage')) THEN
    RAISE EXCEPTION 'Expected analytics objects absent; partial/existing schema requires review';
  END IF;
END;
$guard$;
SELECT set_config('analytics_handoff.started_at',clock_timestamp()::text,true);
CREATE TABLE dojo.analytics_run (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'bounded', 'failed', 'interrupted')),
  error_code TEXT
);
CREATE TABLE dojo.analytics_progress (
  project_id TEXT NOT NULL,
  lane TEXT NOT NULL CHECK (lane IN ('daily', 'backfill')),
  next_day DATE NOT NULL,
  PRIMARY KEY (project_id, lane)
);
CREATE TABLE dojo.analytics_day (
  project_id TEXT NOT NULL,
  day DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('incomplete', 'complete', 'zero', 'unavailable', 'api_failure')),
  pageviews BIGINT CHECK (pageviews >= 0),
  visitors BIGINT CHECK (visitors >= 0),
  collected_at TIMESTAMPTZ,
  run_id BIGINT REFERENCES dojo.analytics_run(id),
  PRIMARY KEY (project_id, day),
  CHECK ((status IN ('complete', 'zero') AND pageviews IS NOT NULL AND visitors IS NOT NULL)
    OR (status NOT IN ('complete', 'zero') AND pageviews IS NULL AND visitors IS NULL)),
  CHECK (status <> 'zero' OR (pageviews = 0 AND visitors = 0))
);
CREATE TABLE dojo.analytics_page_day (
  project_id TEXT NOT NULL,
  day DATE NOT NULL,
  request_path TEXT NOT NULL CHECK (request_path LIKE '/%'),
  pageviews BIGINT NOT NULL CHECK (pageviews >= 0),
  visitors BIGINT NOT NULL CHECK (visitors >= 0),
  PRIMARY KEY (project_id, day, request_path),
  FOREIGN KEY (project_id, day) REFERENCES dojo.analytics_day(project_id, day)
);
-- Staging survives process interruption; public readers must use page_day only.
CREATE TABLE dojo.analytics_stage (
  project_id TEXT NOT NULL,
  day DATE NOT NULL,
  request_path TEXT NOT NULL CHECK (request_path LIKE '/%'),
  pageviews BIGINT NOT NULL CHECK (pageviews >= 0),
  visitors BIGINT NOT NULL CHECK (visitors >= 0),
  PRIMARY KEY (project_id, day, request_path)
);
ALTER TABLE dojo.analytics_run OWNER TO tullyelly_admin;
ALTER TABLE dojo.analytics_progress OWNER TO tullyelly_admin;
ALTER TABLE dojo.analytics_day OWNER TO tullyelly_admin;
ALTER TABLE dojo.analytics_page_day OWNER TO tullyelly_admin;
ALTER TABLE dojo.analytics_stage OWNER TO tullyelly_admin;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
VALUES
  ('076_create_analytics_archive.sql','0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553','sha256','applied',
   clock_timestamp(),current_setting('analytics_handoff.started_at')::timestamptz,
   floor(extract(epoch FROM (clock_timestamp()-current_setting('analytics_handoff.started_at')::timestamptz))*1000)::integer,NULL);
COMMIT;
