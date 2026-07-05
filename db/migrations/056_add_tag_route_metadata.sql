-- 056_add_tag_route_metadata.sql
-- Add canonical display and routing metadata to dojo.tags.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.tags
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS href_kind TEXT,
  ADD COLUMN IF NOT EXISTS is_clickable BOOLEAN,
  ADD COLUMN IF NOT EXISTS meta JSONB;

UPDATE dojo.tags
SET
  display_name = COALESCE(display_name, name),
  href_kind = COALESCE(href_kind, 'tag'),
  is_clickable = COALESCE(is_clickable, TRUE),
  meta = COALESCE(meta, '{}'::jsonb)
WHERE display_name IS NULL
   OR href_kind IS NULL
   OR is_clickable IS NULL
   OR meta IS NULL;

ALTER TABLE dojo.tags
  ALTER COLUMN href_kind SET DEFAULT 'tag',
  ALTER COLUMN href_kind SET NOT NULL,
  ALTER COLUMN is_clickable SET DEFAULT TRUE,
  ALTER COLUMN is_clickable SET NOT NULL,
  ALTER COLUMN meta SET DEFAULT '{}'::jsonb,
  ALTER COLUMN meta SET NOT NULL;

COMMENT ON COLUMN dojo.tags.display_name IS
  'Canonical display label for the tag; falls back to the slug in application code.';

COMMENT ON COLUMN dojo.tags.href IS
  'Optional canonical link target for smart tag rendering.';

COMMENT ON COLUMN dojo.tags.href_kind IS
  'Classifies the canonical tag href for routing and UI behavior.';

COMMENT ON COLUMN dojo.tags.is_clickable IS
  'Controls whether smart tag rendering should produce a link.';

COMMENT ON COLUMN dojo.tags.meta IS
  'Optional JSON payload for future tag display and routing metadata.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_href_kind_check'
      AND conrelid = 'dojo.tags'::regclass
  ) THEN
    ALTER TABLE dojo.tags
    ADD CONSTRAINT tags_href_kind_check
    CHECK (href_kind IN ('tag', 'persona', 'squad', 'custom', 'external', 'none'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_href_check'
      AND conrelid = 'dojo.tags'::regclass
  ) THEN
    ALTER TABLE dojo.tags
    ADD CONSTRAINT tags_href_check
    CHECK (href IS NULL OR btrim(href) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_display_name_check'
      AND conrelid = 'dojo.tags'::regclass
  ) THEN
    ALTER TABLE dojo.tags
    ADD CONSTRAINT tags_display_name_check
    CHECK (display_name IS NULL OR btrim(display_name) <> '');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_meta_object_check'
      AND conrelid = 'dojo.tags'::regclass
  ) THEN
    ALTER TABLE dojo.tags
    ADD CONSTRAINT tags_meta_object_check
    CHECK (jsonb_typeof(meta) = 'object');
  END IF;
END
$$;

INSERT INTO dojo.tags (
  name,
  slug,
  display_name,
  href,
  href_kind,
  is_clickable,
  meta
)
VALUES
  ('mark2', 'mark2', 'mark2', '/mark2', 'persona', TRUE, '{}'::jsonb),
  ('cardattack', 'cardattack', 'cardattack', '/cardattack', 'persona', TRUE, '{}'::jsonb),
  ('theabbott', 'theabbott', 'theabbott', '/theabbott', 'persona', TRUE, '{}'::jsonb),
  ('unclejimmy', 'unclejimmy', 'unclejimmy', '/unclejimmy', 'persona', TRUE, '{}'::jsonb),
  ('tullyelly', 'tullyelly', 'tullyelly', '/tullyelly', 'persona', TRUE, '{}'::jsonb),
  ('shaolin', 'shaolin', 'shaolin', '/shaolin', 'persona', TRUE, '{}'::jsonb),
  ('lulu', 'lulu', 'lulu', '/unclejimmy/squad/lulu', 'squad', TRUE, '{}'::jsonb),
  ('bonnibel', 'bonnibel', 'bonnibel', '/unclejimmy/squad/bonnibel', 'squad', TRUE, '{}'::jsonb),
  ('jeff-meff', 'jeff-meff', 'jeff-meff', '/unclejimmy/squad/jeff-meff', 'squad', TRUE, '{}'::jsonb),
  ('nikkigirl', 'nikkigirl', 'nikkigirl', '/unclejimmy/squad/nikkigirl', 'squad', TRUE, '{}'::jsonb),
  ('eeeeeeeemma', 'eeeeeeeemma', 'eeeeeeeemma', '/unclejimmy/squad/eeeeeeeemma', 'squad', TRUE, '{}'::jsonb),
  ('doom', 'doom', 'DOOM', NULL, 'tag', TRUE, '{}'::jsonb)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  href = EXCLUDED.href,
  href_kind = EXCLUDED.href_kind,
  is_clickable = EXCLUDED.is_clickable,
  meta = dojo.tags.meta || EXCLUDED.meta;

COMMIT;
