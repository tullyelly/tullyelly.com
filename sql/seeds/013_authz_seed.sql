-- WU-376: Authority seed data
SET search_path = dojo, public;

-- 1) app: tcdb
INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('tcdb','TCDb', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2) features
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT app.id, feature.key, feature.description, TRUE
FROM dojo.authz_app app
CROSS JOIN (VALUES
  ('menu.view.tcdb', 'menu visibility for tcdb'),
  ('tcdb.snapshot.create', 'create homie snapshot'),
  ('tcdb.snapshot.view', 'view snapshot history')
) AS feature(key, description)
WHERE app.slug = 'tcdb'
ON CONFLICT (key) DO NOTHING;

-- 3) roles
INSERT INTO dojo.authz_role (name, description) VALUES
  ('viewer','default viewer'),
  ('editor','can create entries'),
  ('admin','full access')
ON CONFLICT (name) DO NOTHING;

-- 4) grants: editor → create
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow'
FROM dojo.authz_role r
JOIN dojo.authz_feature f ON f.key = 'tcdb.snapshot.create'
WHERE r.name = 'editor'
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- 5) grants: admin → all seeded features (explicit rows)
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow'
FROM dojo.authz_role r
CROSS JOIN dojo.authz_feature f
WHERE r.name = 'admin'
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- 6) map admin user by NextAuth identity.
-- Provide one of these at runtime (UUID from auth.users.id):
--   \set admin_user_id '00000000-0000-0000-0000-000000000000'
--   \set admin_email   'you@example.com'
DO $$
DECLARE
  admin_role_id BIGINT;
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM dojo.authz_role WHERE name='admin';

  IF current_setting('admin_user_id', true) IS NOT NULL THEN
    admin_user_id := current_setting('admin_user_id', true)::UUID;
  ELSIF current_setting('admin_email', true) IS NOT NULL THEN
    SELECT u.id INTO admin_user_id FROM auth.users u WHERE u.email = current_setting('admin_email', true);
  END IF;

  IF admin_role_id IS NOT NULL AND admin_user_id IS NOT NULL THEN
    INSERT INTO dojo.authz_user_role (user_id, role_id)
    VALUES (admin_user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END$$;

-- Usage:
-- psql "$DATABASE_URL" -v admin_email='you@example.com' -f sql/seeds/013_authz_seed.sql
-- or:
-- psql "$DATABASE_URL" -v admin_user_id='uuid-value' -f sql/seeds/013_authz_seed.sql
