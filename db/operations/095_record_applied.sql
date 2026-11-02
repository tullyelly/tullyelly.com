-- James only: AFTER evidence of successful exact-file execution and read-only postflight.
-- Not proof of execution from installed state alone. Reconciliation timestamps; duration unknown.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(hashtext('cipher:schema-migrations'));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.menu_node IN SHARE MODE;
LOCK TABLE dojo.authz_feature, dojo.authz_app, dojo.authz_role_feature IN SHARE MODE;
DO $admin$
DECLARE
  parent_node dojo.menu_node%ROWTYPE;
  admin_node dojo.menu_node%ROWTYPE;
  matches integer;
  required CONSTANT jsonb := '["admin.app.view", "admin.membership.manage"]'::jsonb;
BEGIN
  SELECT count(*) INTO matches FROM dojo.menu_node
  WHERE persona = 'mark2' AND kind = 'persona' AND parent_id IS NULL;
  IF matches <> 1 THEN RAISE EXCEPTION '095: expected exactly one mark2 root'; END IF;
  SELECT * INTO STRICT parent_node FROM dojo.menu_node
  WHERE persona = 'mark2' AND kind = 'persona' AND parent_id IS NULL;
  IF parent_node.hidden OR NOT parent_node.published OR parent_node.feature_key IS NOT NULL
     OR (parent_node.meta ? 'requires' AND parent_node.meta->'requires' <> '[]'::jsonb) THEN
    RAISE EXCEPTION '095: unexpected mark2 root restriction or publication state';
  END IF;
  SELECT count(*) INTO matches FROM dojo.menu_node
  WHERE href = '/mark2/admin' OR feature_key = 'menu.mark2.admin';
  IF matches <> 1 THEN RAISE EXCEPTION '095: expected exactly one Admin href/feature identity; found %', matches; END IF;
  SELECT * INTO STRICT admin_node FROM dojo.menu_node
  WHERE href = '/mark2/admin' OR feature_key = 'menu.mark2.admin';
  IF admin_node.href IS DISTINCT FROM '/mark2/admin' OR admin_node.feature_key IS DISTINCT FROM 'menu.mark2.admin'
     OR admin_node.persona <> 'mark2' OR admin_node.kind <> 'link' OR admin_node.parent_id IS DISTINCT FROM parent_node.id
     OR admin_node.hidden OR NOT admin_node.published THEN
    RAISE EXCEPTION '095: conflicting Admin identity, parent or suppressed publication state';
  END IF;
  IF jsonb_typeof(admin_node.meta) IS DISTINCT FROM 'object'
     OR (admin_node.meta ? 'requires' AND admin_node.meta->'requires' <> '[]'::jsonb
         AND admin_node.meta->'requires' IS DISTINCT FROM required) THEN
    RAISE EXCEPTION '095: conflicting Admin requirements; expected absent, [] or %', required;
  END IF;
  SELECT count(*) INTO matches FROM dojo.authz_feature f JOIN dojo.authz_app a ON a.id = f.app_id
  WHERE (f.key IN ('admin.app.view', 'admin.membership.manage', 'admin.analytics.manage') AND a.slug = 'admin' AND f.enabled)
     OR (f.key = 'menu.mark2.admin' AND a.slug = 'menu' AND f.enabled);
  IF matches <> 4 THEN RAISE EXCEPTION '095: required existing features missing, disabled or in unexpected app scopes'; END IF;
  IF EXISTS (SELECT 1 FROM dojo.authz_role_feature rf JOIN dojo.authz_feature f ON f.id = rf.feature_id
             WHERE f.key = 'menu.mark2.admin') THEN
    RAISE EXCEPTION '095: legacy menu.mark2.admin now has role grants; review partial-rollout safety';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dojo.v_menu_published
                 WHERE id = admin_node.id AND feature_key = 'menu.mark2.admin'
                   AND meta->'requires' = required AND NOT hidden) THEN
    RAISE EXCEPTION '095: reviewed Admin requirements absent from published view';
  END IF;
END;
$admin$;
DO $ledger$
BEGIN
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '095%' AND filename <> '095_restrict_admin_menu_requirements.sql') THEN
    RAISE EXCEPTION '095 number already occupied';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '095_restrict_admin_menu_requirements.sql'
             AND (checksum IS DISTINCT FROM 'e8952aaa34b9c4dbe00cfd6d594d439a17ab79890d67c7cd6d2a0bdd3870f490' OR checksum_algorithm IS DISTINCT FROM 'sha256'
                  OR status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '095 ledger conflicts; review separately';
  END IF;
  INSERT INTO dojo.schema_migration
    (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
  SELECT '095_restrict_admin_menu_requirements.sql', 'e8952aaa34b9c4dbe00cfd6d594d439a17ab79890d67c7cd6d2a0bdd3870f490', 'sha256', 'applied', now(), now(), NULL, NULL
  WHERE NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '095_restrict_admin_menu_requirements.sql');
END;
$ledger$;
COMMIT;
