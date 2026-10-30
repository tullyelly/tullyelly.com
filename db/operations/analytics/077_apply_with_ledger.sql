-- Operational bundle; original migration body below is unchanged.
-- Ledger checksum identifies the original file, not this reviewed bundle.
-- Operational provenance and resumable, explicitly selected imports.
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
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '077_analytics_operations.sql') THEN
    RAISE EXCEPTION 'Selected ledger row already exists; inspect, do not replay';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dojo.schema_migration
    WHERE filename='076_create_analytics_archive.sql' AND checksum_algorithm='sha256'
      AND checksum='0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553'
      AND status='applied' AND applied_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Exact applied 076 ledger proof required';
  END IF;
  IF (SELECT count(*) FROM dojo.authz_app WHERE slug='admin') <> 1
    OR (SELECT count(*) FROM dojo.authz_role WHERE name='admin') <> 1
    OR EXISTS (SELECT 1 FROM dojo.authz_feature WHERE key='admin.analytics.manage') THEN
    RAISE EXCEPTION 'Authorization prerequisites differ from reviewed absent-feature state';
  END IF;
  IF to_regprocedure('dojo.authz_bump_revision(uuid)') IS NULL
    OR to_regclass('dojo.authz_policy_rev') IS NULL THEN
    RAISE EXCEPTION 'Revision prerequisites missing';
  END IF;
END;
$guard$;
SELECT set_config('analytics_handoff.started_at',clock_timestamp()::text,true);
-- Capture only the original migration's affected users; temporary data is not exported.
CREATE TEMP TABLE analytics_revision_before ON COMMIT DROP AS
SELECT DISTINCT membership.user_id, COALESCE(rev.revision,0) AS revision
FROM dojo.authz_user_app_role membership
JOIN dojo.authz_role role ON role.id=membership.role_id
LEFT JOIN dojo.authz_policy_rev rev ON rev.user_id=membership.user_id
WHERE role.name='admin' AND (membership.app_id IS NULL OR membership.app_id=
  (SELECT id FROM dojo.authz_app WHERE slug='admin'));
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
DO $check$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dojo.authz_feature f
    JOIN dojo.authz_app a ON a.id=f.app_id
    JOIN dojo.authz_role_feature g ON g.feature_id=f.id
    JOIN dojo.authz_role r ON r.id=g.role_id
    WHERE f.key='admin.analytics.manage' AND f.enabled AND a.slug='admin'
      AND r.name='admin' AND g.effect='allow') THEN
    RAISE EXCEPTION 'Analytics feature/grant postcondition failed';
  END IF;
  IF EXISTS (SELECT 1 FROM analytics_revision_before b
    LEFT JOIN dojo.authz_policy_rev r ON r.user_id=b.user_id
    WHERE r.revision IS DISTINCT FROM b.revision+1) THEN
    RAISE EXCEPTION 'Affected policy revision was not incremented exactly once';
  END IF;
END;
$check$;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
VALUES
  ('077_analytics_operations.sql','88584aa867075149dc0b7d1b984262443462493c0e446fb8c00122446128f694','sha256','applied',
   clock_timestamp(),current_setting('analytics_handoff.started_at')::timestamptz,
   floor(extract(epoch FROM (clock_timestamp()-current_setting('analytics_handoff.started_at')::timestamptz))*1000)::integer,NULL);
COMMIT;
