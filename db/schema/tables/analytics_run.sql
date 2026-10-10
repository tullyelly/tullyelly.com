CREATE TABLE dojo.analytics_run (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'bounded', 'failed', 'interrupted')),
  error_code TEXT,
  lane TEXT CHECK (lane IN ('daily', 'backfill')),
  processed_days INTEGER NOT NULL DEFAULT 0 CHECK (processed_days >= 0),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

ALTER TABLE dojo.analytics_run OWNER TO tullyelly_admin;
