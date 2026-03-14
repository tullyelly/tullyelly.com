-- 029_add_audit_fields_to_users_and_tags.sql
-- Add standard audit fields to auth.users and normalize dojo.tags to the shared audit pattern.

SET search_path = dojo, auth, public;

BEGIN;

-- dojo.tags was introduced in 028 with canonical tag identity fields. Add created_by and
-- updated_by while preserving the base created_at/updated_at contract from that migration.
ALTER TABLE dojo.tags
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.tags
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.tags
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER;

CREATE OR REPLACE FUNCTION dojo.audit_stamp_tags()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := CURRENT_TIMESTAMP; END IF;
    IF NEW.created_by IS NULL THEN NEW.created_by := CURRENT_USER; END IF;
    IF NEW.updated_at IS NULL THEN NEW.updated_at := CURRENT_TIMESTAMP; END IF;
    NEW.updated_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
    NEW.updated_by := CURRENT_USER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tags_set_updated_at ON dojo.tags;
DROP TRIGGER IF EXISTS trg_audit_tags ON dojo.tags;
CREATE TRIGGER trg_audit_tags
BEFORE INSERT OR UPDATE ON dojo.tags
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_tags();

-- Add the same audit surface to auth.users so secret identities and comments can share
-- the same provenance fields as the rest of the schema.
ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE auth.users
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE auth.users
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DROP TRIGGER IF EXISTS trg_audit_auth_users ON auth.users;
CREATE TRIGGER trg_audit_auth_users
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
