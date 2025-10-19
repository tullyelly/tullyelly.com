-- 013_authz_foundation.sql
-- Ground-up authz foundation with APP-SCOPED membership.
-- Tables:
--   dojo.authz_app
--   dojo.authz_feature
--   dojo.authz_role
--   dojo.authz_role_feature
--   dojo.authz_user_app_role   (NEW: user + app + role, NULL app_id = global)
-- Seeds:
--   app 'admin' (is_public=false), feature 'admin.app.view', roles (viewer/editor/admin), grant admin->admin.app.view
-- Idempotent; safe to re-run.

SET search_path = dojo, public;

BEGIN;

-- apps
CREATE TABLE IF NOT EXISTS dojo.authz_app (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);
COMMENT ON TABLE dojo.authz_app IS 'Applications for capability namespacing';
ALTER TABLE dojo.authz_app OWNER TO tullyelly_admin;
DROP TRIGGER IF EXISTS trg_audit_authz_app ON dojo.authz_app;
CREATE TRIGGER trg_audit_authz_app
BEFORE INSERT OR UPDATE ON dojo.authz_app
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- features
CREATE TABLE IF NOT EXISTS dojo.authz_feature (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES dojo.authz_app(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL, -- {app}.{area}.{verb}
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT chk_authz_feature_key_format CHECK (key ~ '^[a-z0-9]+(\.[a-z0-9]+){2,}$')
);
COMMENT ON TABLE dojo.authz_feature IS 'Capabilities evaluated by the authorization layer';
ALTER TABLE dojo.authz_feature OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_authz_feature_key ON dojo.authz_feature(key);
DROP TRIGGER IF EXISTS trg_audit_authz_feature ON dojo.authz_feature;
CREATE TRIGGER trg_audit_authz_feature
BEFORE INSERT OR UPDATE ON dojo.authz_feature
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- roles
CREATE TABLE IF NOT EXISTS dojo.authz_role (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- viewer, editor, admin
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);
COMMENT ON TABLE dojo.authz_role IS 'Role groupings of capabilities';
ALTER TABLE dojo.authz_role OWNER TO tullyelly_admin;
DROP TRIGGER IF EXISTS trg_audit_authz_role ON dojo.authz_role;
CREATE TRIGGER trg_audit_authz_role
BEFORE INSERT OR UPDATE ON dojo.authz_role
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- role -> feature grants
CREATE TABLE IF NOT EXISTS dojo.authz_role_feature (
  role_id BIGINT NOT NULL REFERENCES dojo.authz_role(id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES dojo.authz_feature(id) ON DELETE CASCADE,
  effect TEXT NOT NULL CHECK (effect IN ('allow','deny')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  PRIMARY KEY (role_id, feature_id)
);
COMMENT ON TABLE dojo.authz_role_feature IS 'Grants/denies of features to roles; deny beats allow';
ALTER TABLE dojo.authz_role_feature OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_authz_role_feature_role ON dojo.authz_role_feature(role_id);
CREATE INDEX IF NOT EXISTS ix_authz_role_feature_feature ON dojo.authz_role_feature(feature_id);
DROP TRIGGER IF EXISTS trg_audit_authz_role_feature ON dojo.authz_role_feature;
CREATE TRIGGER trg_audit_authz_role_feature
BEFORE INSERT OR UPDATE ON dojo.authz_role_feature
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- APP-SCOPED user -> role membership (NextAuth users)
-- NULL app_id means GLOBAL grant (applies to all apps).
CREATE TABLE IF NOT EXISTS dojo.authz_user_app_role (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id  BIGINT NULL REFERENCES dojo.authz_app(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES dojo.authz_role(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  PRIMARY KEY (user_id, role_id, app_id)
);
COMMENT ON TABLE dojo.authz_user_app_role IS 'User membership to roles, optionally scoped to a specific app (NULL app_id = global)';
ALTER TABLE dojo.authz_user_app_role OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_authz_user_app_role_user ON dojo.authz_user_app_role(user_id);
CREATE INDEX IF NOT EXISTS ix_authz_user_app_role_app  ON dojo.authz_user_app_role(app_id);
CREATE INDEX IF NOT EXISTS ix_authz_user_app_role_role ON dojo.authz_user_app_role(role_id);
DROP TRIGGER IF EXISTS trg_audit_authz_user_app_role ON dojo.authz_user_app_role;
CREATE TRIGGER trg_audit_authz_user_app_role
BEFORE INSERT OR UPDATE ON dojo.authz_user_app_role
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- Seed: /admin app (private)
INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('admin','Admin', FALSE)
ON CONFLICT (slug) DO UPDATE SET is_public = EXCLUDED.is_public;

-- Seed: admin.app.view feature under 'admin'
WITH adm AS (SELECT id FROM dojo.authz_app WHERE slug='admin'),
     existing AS (SELECT id, app_id FROM dojo.authz_feature WHERE key='admin.app.view')
UPDATE dojo.authz_feature f
   SET app_id = (SELECT id FROM adm),
       description = COALESCE(f.description, 'access the /admin app'),
       enabled = COALESCE(f.enabled, TRUE)
  FROM existing e
 WHERE f.id = e.id
   AND f.app_id <> (SELECT id FROM adm);

INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT id, 'admin.app.view', 'access the /admin app', TRUE
FROM dojo.authz_app WHERE slug='admin'
ON CONFLICT (key) DO NOTHING;

-- Seed: baseline roles
INSERT INTO dojo.authz_role (name, description) VALUES
  ('viewer','default viewer'),
  ('editor','standard editor'),
  ('admin','full access')
ON CONFLICT (name) DO NOTHING;

-- Grant admin -> admin.app.view
WITH r AS (SELECT id FROM dojo.authz_role WHERE name='admin'),
     f AS (SELECT id FROM dojo.authz_feature WHERE key='admin.app.view')
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT r.id, f.id, 'allow' FROM r, f
ON CONFLICT (role_id, feature_id) DO NOTHING;

-- Optional: map an initial admin for the admin app (scoped)
-- Provide ONE at runtime:
--   \set admin_user_id 'UUID from auth.users.id'
--   \set admin_email   'you@example.com'
DO $blk$
DECLARE
  v_role_id  BIGINT;
  v_user_id  UUID;
  v_app_id   BIGINT;
BEGIN
  SELECT id INTO v_role_id FROM dojo.authz_role WHERE name='admin';
  SELECT id INTO v_app_id  FROM dojo.authz_app  WHERE slug='admin';

  IF current_setting('admin_user_id', true) IS NOT NULL THEN
    v_user_id := current_setting('admin_user_id', true)::UUID;
  ELSIF current_setting('admin_email', true) IS NOT NULL THEN
    SELECT u.id INTO v_user_id FROM auth.users u WHERE u.email = current_setting('admin_email', true);
  END IF;

  IF v_role_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO dojo.authz_user_app_role (user_id, app_id, role_id)
    VALUES (v_user_id, v_app_id, v_role_id)
    ON CONFLICT (user_id, role_id, app_id) DO NOTHING;
  END IF;
END
$blk$;

COMMIT;

-- Usage:
-- psql "$DATABASE_URL" -f db/migrations/013_authz_foundation.sql
-- psql "$DATABASE_URL" -v admin_email='you@example.com' -f db/migrations/013_authz_foundation.sql
-- psql "$DATABASE_URL" -v admin_user_id='00000000-0000-0000-0000-000000000000' -f db/migrations/013_authz_foundation.sql
