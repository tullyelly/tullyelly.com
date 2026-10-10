-- Run only after migration 076 on a confirmed disposable non-production target.
-- This fixture tests SQL constraints/replacement; collector concurrency needs two connections.
BEGIN;
DO $$
DECLARE
  fixture_project TEXT := 'analytics-fixture-' || txid_current()::text;
  count_rows INTEGER;
BEGIN
  INSERT INTO dojo.analytics_day(project_id, day, status, pageviews, visitors)
    VALUES (fixture_project, '2024-02-29', 'complete', 2, 1);
  INSERT INTO dojo.analytics_page_day(project_id, day, request_path, pageviews, visitors)
    VALUES (fixture_project, '2024-02-29', '/exact', 2, 1);
  INSERT INTO dojo.analytics_page_day(project_id, day, request_path, pageviews, visitors)
    VALUES (fixture_project, '2024-02-29', '/exact', 4, 2)
    ON CONFLICT (project_id, day, request_path)
    DO UPDATE SET pageviews = EXCLUDED.pageviews, visitors = EXCLUDED.visitors;
  SELECT count(*) INTO count_rows FROM dojo.analytics_page_day
    WHERE project_id = fixture_project AND pageviews = 4;
  IF count_rows <> 1 THEN RAISE EXCEPTION 'Replacement failed'; END IF;
  BEGIN
    INSERT INTO dojo.analytics_day(project_id, day, status)
      VALUES (fixture_project, '2024-03-01', 'complete');
    RAISE EXCEPTION 'Missing totals incorrectly accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO dojo.analytics_progress(project_id, lane, next_day) VALUES
    (fixture_project, 'daily', '2024-03-01'),
    (fixture_project, 'backfill', '2024-01-01');
  SELECT count(*) INTO count_rows FROM dojo.analytics_progress WHERE project_id = fixture_project;
  IF count_rows <> 2 THEN RAISE EXCEPTION 'Progress lanes collided'; END IF;
END $$;
ROLLBACK;
