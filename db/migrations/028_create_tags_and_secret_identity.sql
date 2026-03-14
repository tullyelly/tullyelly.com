-- 028_create_tags_and_secret_identity.sql
-- Introduce canonical site tags and link auth users to a tag-backed secret identity.

SET search_path = dojo, auth, public;

BEGIN;

-- Shared trigger for updated_at maintenance. Reuse it if it already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'dojo'
      AND p.proname = 'set_updated_at_timestamp'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE $create$
      CREATE FUNCTION dojo.set_updated_at_timestamp()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $function$
    $create$;
  END IF;
END
$$;

-- Canonical source for site tags used across content, users, and UI surfaces.
CREATE TABLE IF NOT EXISTS dojo.tags (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE dojo.tags IS
  'Canonical source for site tags used across content, users, and other site surfaces.';

CREATE INDEX IF NOT EXISTS idx_tags_slug ON dojo.tags (slug);

DROP TRIGGER IF EXISTS trg_tags_set_updated_at ON dojo.tags;
CREATE TRIGGER trg_tags_set_updated_at
BEFORE UPDATE ON dojo.tags
FOR EACH ROW
EXECUTE FUNCTION dojo.set_updated_at_timestamp();

-- secret_identity_tag_id links a user to the tag that represents their "secret identity".
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS secret_identity_tag_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_secret_identity_tag_id_fkey'
      AND conrelid = 'auth.users'::regclass
  ) THEN
    ALTER TABLE auth.users
    ADD CONSTRAINT users_secret_identity_tag_id_fkey
    FOREIGN KEY (secret_identity_tag_id)
    REFERENCES dojo.tags(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

COMMENT ON COLUMN auth.users.secret_identity_tag_id IS
  'Links a user to dojo.tags so the selected tag can act as the user''s secret identity.';

CREATE INDEX IF NOT EXISTS idx_users_secret_identity_tag
ON auth.users(secret_identity_tag_id);

COMMIT;
