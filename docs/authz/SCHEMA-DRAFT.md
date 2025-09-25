# SCHEMA DRAFT ; WU-375 (Spike)

> This is the blueprint for WU-376 migrations. New authz tables live in **`dojo`** and use the repo’s audit + trigger pattern.

## Tables

### `dojo.authz_app`

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `slug TEXT UNIQUE NOT NULL` ; e.g., `tcdb`
- `name TEXT NOT NULL`
- `is_public BOOLEAN NOT NULL DEFAULT TRUE` ; v1 informational only (apps remain public)
- Audit columns
- Owner/comment: `ALTER TABLE dojo.authz_app OWNER TO tullyelly_admin;`
- Trigger: `trg_audit_authz_app` → `dojo.audit_stamp_generic()`

### `dojo.authz_feature`

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `app_id BIGINT NOT NULL REFERENCES dojo.authz_app(id)`
- `key TEXT UNIQUE NOT NULL` ; `{app}.{area}.{verb}`
- `description TEXT`
- `enabled BOOLEAN NOT NULL DEFAULT TRUE`
- Audit columns
- Owner; audit trigger `trg_audit_authz_feature`

### `dojo.authz_role`

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `name TEXT UNIQUE NOT NULL` ; `viewer`, `editor`, `admin`
- `description TEXT`
- Audit columns
- Owner; audit trigger `trg_audit_authz_role`

### `dojo.authz_role_feature`

- `role_id BIGINT NOT NULL REFERENCES dojo.authz_role(id) ON DELETE CASCADE`
- `feature_id BIGINT NOT NULL REFERENCES dojo.authz_feature(id) ON DELETE CASCADE`
- `effect TEXT NOT NULL CHECK (effect IN ('allow','deny'))`
- `PRIMARY KEY (role_id, feature_id)`
- (Optional future: add `conditions JSONB` for time-boxed/owner rules)
- Audit columns
- Owner; audit trigger `trg_audit_authz_role_feature`

### `dojo.authz_user_role`

- `user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `role_id BIGINT NOT NULL REFERENCES dojo.authz_role(id) ON DELETE CASCADE`
- `PRIMARY KEY (user_id, role_id)`
- Audit columns
- Owner; audit trigger `trg_audit_authz_user_role`

### `dojo.audit_log`

- `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- `ts TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `actor_user_id TEXT REFERENCES auth.users(id)`
- `action TEXT NOT NULL` ; e.g., `role_granted`, `role_revoked`, `snapshot_created`
- `target_user_id TEXT REFERENCES auth.users(id)`
- `feature_key TEXT` ; capability involved (if any)
- `effect TEXT` ; `allow|deny|success|error`
- `request_id TEXT`, `ip INET`
- `meta JSONB` ; inputs hash / context
- Owner; (optional) index `ix_audit_log_ts`

## Indexing (indicative)

- `CREATE INDEX IF NOT EXISTS ix_authz_feature_key ON dojo.authz_feature (key);`
- `CREATE INDEX IF NOT EXISTS ix_authz_role_feature_role ON dojo.authz_role_feature (role_id);`
- `CREATE INDEX IF NOT EXISTS ix_authz_user_role_user ON dojo.authz_user_role (user_id);`
- `CREATE INDEX IF NOT EXISTS ix_audit_log_ts ON dojo.audit_log (ts);`

## Notes

- All tables include the standard audit columns + `trg_audit_*` calling `dojo.audit_stamp_generic()`.
- IDs are BIGINT identities for consistency with existing tables.
- Cross-schema FK to `auth.users(id)` reflects NextAuth as the identity source.
