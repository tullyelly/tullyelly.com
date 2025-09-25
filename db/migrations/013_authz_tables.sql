-- WU-376: Authority tables
SET search_path = dojo, public;

-- Ensure reruns align column types with auth.users(id)
ALTER TABLE IF EXISTS dojo.authz_user_role
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE IF EXISTS dojo.audit_log
  ALTER COLUMN actor_user_id TYPE UUID USING actor_user_id::UUID,
  ALTER COLUMN target_user_id TYPE UUID USING target_user_id::UUID;

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
COMMENT ON TABLE dojo.authz_app IS 'Applications for capability namespacing (apps remain public in v1)';
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
COMMENT ON TABLE dojo.authz_feature IS 'Capabilities (feature flags) evaluated by the authority layer';
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

-- role → feature grants
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
COMMENT ON TABLE dojo.authz_role_feature IS 'Grants or denies of features to roles; deny beats allow';
ALTER TABLE dojo.authz_role_feature OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_authz_role_feature_role ON dojo.authz_role_feature(role_id);
CREATE INDEX IF NOT EXISTS ix_authz_role_feature_feature ON dojo.authz_role_feature(feature_id);
DROP TRIGGER IF EXISTS trg_audit_authz_role_feature ON dojo.authz_role_feature;
CREATE TRIGGER trg_audit_authz_role_feature
BEFORE INSERT OR UPDATE ON dojo.authz_role_feature
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- user → role membership (NextAuth users)
CREATE TABLE IF NOT EXISTS dojo.authz_user_role (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES dojo.authz_role(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  PRIMARY KEY (user_id, role_id)
);
COMMENT ON TABLE dojo.authz_user_role IS 'User membership to roles; user_id is NextAuth auth.users(id)';
ALTER TABLE dojo.authz_user_role OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_authz_user_role_user ON dojo.authz_user_role(user_id);
CREATE INDEX IF NOT EXISTS ix_authz_user_role_role ON dojo.authz_user_role(role_id);
DROP TRIGGER IF EXISTS trg_audit_authz_user_role ON dojo.authz_user_role;
CREATE TRIGGER trg_audit_authz_user_role
BEFORE INSERT OR UPDATE ON dojo.authz_user_role
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- audit log (authority-relevant events; generic table lives in dojo)
CREATE TABLE IF NOT EXISTS dojo.audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,              -- role_granted | role_revoked | snapshot_created | ...
  target_user_id UUID REFERENCES auth.users(id),
  feature_key TEXT,                  -- capability key involved if any
  effect TEXT,                       -- allow | deny | success | error
  request_id TEXT,
  ip INET,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);
ALTER TABLE dojo.audit_log OWNER TO tullyelly_admin;
CREATE INDEX IF NOT EXISTS ix_audit_log_ts ON dojo.audit_log (ts);
DROP TRIGGER IF EXISTS trg_audit_audit_log ON dojo.audit_log;
CREATE TRIGGER trg_audit_audit_log
BEFORE INSERT OR UPDATE ON dojo.audit_log
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();
