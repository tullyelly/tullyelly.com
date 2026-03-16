-- 033_create_identity_cartoon.sql
-- Store cartoon portraits keyed by secret identity tag.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.identity_cartoon (
  id SERIAL PRIMARY KEY,
  tag_id INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.identity_cartoon
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.identity_cartoon
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.identity_cartoon
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'identity_cartoon_tag_id_fkey'
      AND conrelid = 'dojo.identity_cartoon'::regclass
  ) THEN
    ALTER TABLE dojo.identity_cartoon
    ADD CONSTRAINT identity_cartoon_tag_id_fkey
    FOREIGN KEY (tag_id)
    REFERENCES dojo.tags(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

COMMENT ON TABLE dojo.identity_cartoon IS
  'Cartoon portrait metadata keyed by secret identity tag.';

COMMENT ON COLUMN dojo.identity_cartoon.image_path IS
  'Relative path to the optimized cartoon portrait asset.';

COMMENT ON COLUMN dojo.identity_cartoon.description IS
  'Optional supporting copy for the cartoon portrait.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_cartoon_tag_id
ON dojo.identity_cartoon(tag_id);

CREATE INDEX IF NOT EXISTS idx_identity_cartoon_created_at
ON dojo.identity_cartoon(created_at DESC);

DROP TRIGGER IF EXISTS trg_audit_identity_cartoon ON dojo.identity_cartoon;
CREATE TRIGGER trg_audit_identity_cartoon
BEFORE INSERT OR UPDATE ON dojo.identity_cartoon
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

COMMIT;
