-- Operational provenance and resumable, explicitly selected imports.
BEGIN;
ALTER TABLE dojo.analytics_run
  ADD COLUMN lane TEXT CHECK (lane IN ('daily', 'backfill')),
  ADD COLUMN processed_days INTEGER NOT NULL DEFAULT 0 CHECK (processed_days >= 0),
  ADD COLUMN request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0);
ALTER TABLE dojo.analytics_progress
  ADD COLUMN start_day DATE,
  ADD COLUMN end_day DATE,
  ADD COLUMN available_from DATE,
  ADD CONSTRAINT analytics_import_range CHECK (
    (start_day IS NULL AND end_day IS NULL AND available_from IS NULL)
    OR (lane = 'backfill' AND start_day IS NOT NULL AND end_day IS NOT NULL
      AND available_from IS NOT NULL AND start_day <= end_day AND start_day >= available_from)
  );
-- Existing phase 1 runs remain lane NULL; do not guess their provenance.
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT id, 'admin.analytics.manage', 'operate the owner analytics archive', TRUE
FROM dojo.authz_app WHERE slug = 'admin'
ON CONFLICT (key) DO NOTHING;
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT role.id, feature.id, 'allow'
FROM dojo.authz_role AS role CROSS JOIN dojo.authz_feature AS feature
WHERE role.name = 'admin' AND feature.key = 'admin.analytics.manage'
ON CONFLICT (role_id, feature_id) DO NOTHING;
-- No new memberships; owner identity is additionally enforced by the server.
DO $$
DECLARE
  affected UUID;
BEGIN
  FOR affected IN
    SELECT DISTINCT membership.user_id
    FROM dojo.authz_user_app_role AS membership
    JOIN dojo.authz_role_feature AS grant_row ON grant_row.role_id = membership.role_id
    JOIN dojo.authz_feature AS feature ON feature.id = grant_row.feature_id
    WHERE feature.key = 'admin.analytics.manage'
      AND (membership.app_id IS NULL OR membership.app_id = feature.app_id)
  LOOP
    PERFORM dojo.authz_bump_revision(affected);
    PERFORM pg_notify('authz_changed', affected::text);
  END LOOP;
END $$;
COMMIT;
