-- Register homie maintenance and retire the route-specific rankings menu key.
SET search_path = dojo, public;

BEGIN;

INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('tcdb', 'TCDB', TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT id, 'tcdb.homie.update', 'update an existing homie', TRUE
FROM dojo.authz_app
WHERE slug = 'tcdb'
ON CONFLICT (key) DO UPDATE
SET app_id = EXCLUDED.app_id,
    description = EXCLUDED.description,
    enabled = TRUE;

INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT role.id, feature.id, 'allow'
FROM dojo.authz_role AS role
CROSS JOIN dojo.authz_feature AS feature
WHERE role.name IN ('editor', 'admin')
  AND feature.key = 'tcdb.homie.update'
ON CONFLICT (role_id, feature_id) DO UPDATE SET effect = 'allow';

DELETE FROM dojo.authz_role_feature
USING dojo.authz_role, dojo.authz_feature
WHERE authz_role_feature.role_id = authz_role.id
  AND authz_role_feature.feature_id = authz_feature.id
  AND authz_role.name = 'viewer'
  AND authz_feature.key = 'tcdb.homie.update';

DO $$
DECLARE
  v_user_id CONSTANT UUID := '3139edc3-2957-4804-aabc-814070eab5d2';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Cannot grant admin access: auth user % does not exist', v_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM dojo.authz_role WHERE name = 'admin'
  ) THEN
    RAISE EXCEPTION 'Cannot grant admin access: admin role does not exist';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM dojo.authz_app
    WHERE slug IN ('admin', 'tcdb')
  ) <> 2 THEN
    RAISE EXCEPTION 'Cannot grant admin access: admin and tcdb apps must exist';
  END IF;

  INSERT INTO dojo.authz_user_app_role (user_id, app_id, role_id)
  SELECT v_user_id, app.id, role.id
  FROM dojo.authz_app AS app
  CROSS JOIN dojo.authz_role AS role
  WHERE app.slug IN ('admin', 'tcdb')
    AND role.name = 'admin'
  ON CONFLICT (user_id, role_id, app_id) DO NOTHING;

  PERFORM dojo.authz_bump_revision(v_user_id);
  PERFORM pg_notify('authz_changed', v_user_id::text);
END
$$;

UPDATE dojo.authz_feature
SET key = 'menu.cardattack.homies',
    description = 'Menu: Homies'
WHERE key = 'menu.cardattack.tcdb.rankings'
  AND NOT EXISTS (
    SELECT 1 FROM dojo.authz_feature WHERE key = 'menu.cardattack.homies'
  );

UPDATE dojo.menu_node
SET feature_key = 'menu.cardattack.homies',
    label = 'Homies',
    href = '/cardattack/homies'
WHERE feature_key = 'menu.cardattack.tcdb.rankings'
   OR href = '/cardattack/tcdb-rankings';

COMMIT;
