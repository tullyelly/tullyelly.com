-- Create the application audit event store used by authenticated mutations.
SET search_path = dojo, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_key TEXT,
  effect TEXT CHECK (
    effect IS NULL OR effect IN ('allow', 'deny', 'success', 'error')
  ),
  request_id TEXT,
  ip INET,
  meta JSONB
);

COMMENT ON TABLE dojo.audit_log IS
  'Application audit events for authorization and authenticated mutations';

CREATE INDEX IF NOT EXISTS ix_audit_log_ts
  ON dojo.audit_log (ts DESC);

CREATE INDEX IF NOT EXISTS ix_audit_log_actor_user_id
  ON dojo.audit_log (actor_user_id);

CREATE INDEX IF NOT EXISTS ix_audit_log_feature_key
  ON dojo.audit_log (feature_key);

ALTER TABLE dojo.audit_log OWNER TO tullyelly_admin;

COMMIT;
