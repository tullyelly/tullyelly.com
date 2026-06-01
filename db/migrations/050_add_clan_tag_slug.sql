-- 050_add_clan_tag_slug.sql
-- Purpose: Add chronicle-friendly clan tag aliases for <ClanSnapshot /> lookups.

SET search_path = dojo, public;

ALTER TABLE dojo.clan
  ADD COLUMN IF NOT EXISTS tag_slug VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clan_tag_slug_key'
      AND conrelid = 'dojo.clan'::regclass
  ) THEN
    ALTER TABLE dojo.clan
    ADD CONSTRAINT clan_tag_slug_key
    UNIQUE (tag_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clan_tag_slug_check'
      AND conrelid = 'dojo.clan'::regclass
  ) THEN
    ALTER TABLE dojo.clan
    ADD CONSTRAINT clan_tag_slug_check
    CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;
