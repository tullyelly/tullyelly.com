-- Only after migrations 076/077 on a confirmed disposable non-production target.
BEGIN;
DO $$
DECLARE
  fixture_project TEXT := 'analytics-ops-fixture-' || txid_current()::text;
  feature_app TEXT;
BEGIN
  SELECT app.slug INTO feature_app
  FROM dojo.authz_feature AS feature JOIN dojo.authz_app AS app ON app.id = feature.app_id
  WHERE feature.key = 'admin.analytics.manage';
  IF feature_app IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Analytics capability has wrong or missing app'; END IF;
  INSERT INTO dojo.analytics_progress(project_id,lane,next_day,start_day,end_day,available_from)
  VALUES (fixture_project,'backfill','2024-02-28','2024-02-28','2024-02-29','2024-02-01');
  UPDATE dojo.analytics_progress SET next_day = '2024-02-29' WHERE project_id = fixture_project AND lane = 'backfill';
  IF NOT EXISTS (SELECT 1 FROM dojo.analytics_progress WHERE project_id = fixture_project
      AND next_day = '2024-02-29' AND end_day = '2024-02-29') THEN
    RAISE EXCEPTION 'Saved range/cursor did not survive a batch';
  END IF;
  BEGIN
    UPDATE dojo.analytics_progress SET end_day = '2024-02-01' WHERE project_id = fixture_project;
    RAISE EXCEPTION 'Reversed import range incorrectly accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO dojo.analytics_run(project_id,lane,status,processed_days,request_count)
  VALUES (fixture_project,'daily','bounded',1,2), (fixture_project,'backfill','complete',2,4);
  IF (SELECT count(*) FROM dojo.analytics_run WHERE project_id = fixture_project AND lane = 'daily' AND status = 'complete') <> 0 THEN
    RAISE EXCEPTION 'Backfill success confused with daily success';
  END IF;
END $$;
ROLLBACK;
