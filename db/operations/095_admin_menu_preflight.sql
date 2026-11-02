BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
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
END;
$admin$;
SELECT current_database(), current_user, current_setting('transaction_read_only') AS read_only;
SELECT * FROM dojo.schema_migration ORDER BY filename;
SELECT count(*) AS menu_rows FROM dojo.menu_node;
SELECT jsonb_agg(to_jsonb(m) ORDER BY id) AS unrelated_rows FROM dojo.menu_node m
WHERE href IS DISTINCT FROM '/mark2/admin';
SELECT to_jsonb(m) - ARRAY['meta', 'updated_at', 'updated_by'] AS admin_preserved_fields,
       meta - 'requires' AS preserved_metadata, meta->'requires' AS requirements
FROM dojo.menu_node m WHERE href = '/mark2/admin';
COMMIT;
