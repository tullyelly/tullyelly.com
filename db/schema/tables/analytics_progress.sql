CREATE TABLE dojo.analytics_progress (
  project_id TEXT NOT NULL,
  lane TEXT NOT NULL CHECK (lane IN ('daily', 'backfill')),
  next_day DATE NOT NULL,
  start_day DATE,
  end_day DATE,
  available_from DATE,
  CONSTRAINT analytics_import_range CHECK (
    (start_day IS NULL AND end_day IS NULL AND available_from IS NULL)
    OR (lane = 'backfill' AND start_day IS NOT NULL AND end_day IS NOT NULL
      AND available_from IS NOT NULL AND start_day <= end_day AND start_day >= available_from)
  ),
  PRIMARY KEY (project_id, lane)
);

ALTER TABLE dojo.analytics_progress OWNER TO tullyelly_admin;
