-- Aggregate production traffic only; no visitor identifiers or raw events.
BEGIN;
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
COMMIT;
