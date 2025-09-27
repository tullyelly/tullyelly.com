-- 015_authz_admin_membership_feature.sql
-- Seed admin.membership.manage feature and map to admin role.

SET search_path = dojo, public;

BEGIN;

WITH adm AS (SELECT id FROM dojo.authz_app WHERE slug = 'admin')
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT adm.id, 'admin.membership.manage', 'manage admin memberships', TRUE
FROM adm
ON CONFLICT (key) DO NOTHING;

WITH r AS (SELECT id FROM dojo.authz_role WHERE name = 'admin'),
     f AS (SELECT id FROM dojo.authz_feature WHERE key = 'admin.membership.manage')
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow' FROM r, f
ON CONFLICT (role_id, feature_id) DO NOTHING;

COMMIT;
