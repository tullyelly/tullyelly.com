-- 029_add_audit_fields_to_users_and_tags.sql
-- Add standard audit fields to auth.users and normalize dojo.tags to the shared audit pattern.

SET search_path = dojo, auth, public;

BEGIN;

-- dojo.tags was introduced with partial audit metadata in 028; normalize it to match the
-- shared audit shape used elsewhere in the schema.
ALTER TABLE dojo.tags
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'dojo'
      AND table_name = 'tags'
      AND column_name = 'created_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE dojo.tags
      ALTER COLUMN created_at TYPE TIMESTAMPTZ
      USING created_at AT TIME ZONE current_setting('TimeZone');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'dojo'
      AND table_name = 'tags'
      AND column_name = 'updated_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE dojo.tags
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ
      USING CASE
        WHEN updated_at IS NULL THEN NULL
        ELSE updated_at AT TIME ZONE current_setting('TimeZone')
      END;
  END IF;
END
$$;

UPDATE dojo.tags
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

UPDATE dojo.tags
SET
  updated_at = NULL,
  updated_by = NULL
WHERE updated_by IS NULL
  AND updated_at IS NOT NULL
  AND created_at IS NOT NULL
  AND updated_at = created_at;

ALTER TABLE dojo.tags
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DROP TRIGGER IF EXISTS trg_tags_set_updated_at ON dojo.tags;
DROP TRIGGER IF EXISTS trg_audit_tags ON dojo.tags;
CREATE TRIGGER trg_audit_tags
BEFORE INSERT OR UPDATE ON dojo.tags
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

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
