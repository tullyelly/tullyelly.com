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

ALTER TABLE dojo.analytics_day OWNER TO tullyelly_admin;
