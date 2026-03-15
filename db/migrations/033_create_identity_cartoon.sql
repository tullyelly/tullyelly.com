-- 033_create_identity_cartoon.sql
-- Store cartoon portraits keyed by secret identity tag.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.identity_cartoon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

COMMIT;
