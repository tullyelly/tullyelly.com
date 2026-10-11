CREATE TABLE dojo.analytics_page_day (
  project_id TEXT NOT NULL,
  day DATE NOT NULL,
  request_path TEXT NOT NULL CHECK (request_path LIKE '/%'),
  pageviews BIGINT NOT NULL CHECK (pageviews >= 0),
  visitors BIGINT NOT NULL CHECK (visitors >= 0),
  PRIMARY KEY (project_id, day, request_path),
  FOREIGN KEY (project_id, day) REFERENCES dojo.analytics_day(project_id, day)
);

ALTER TABLE dojo.analytics_page_day OWNER TO tullyelly_admin;
