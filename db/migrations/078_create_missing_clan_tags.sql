-- 078_create_missing_clan_tags.sql
-- Create missing CardAttack clan tags on insert and backfill existing clans.
-- Requires the tag route metadata migrations through 074.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE FUNCTION dojo.create_missing_clan_tag(
  p_tag_slug TEXT,
  p_clan_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_slug TEXT := NULLIF(btrim(p_tag_slug), '');
BEGIN
  -- Match homie identity creation: a clan without a tag_slug has no tag yet.
  IF normalized_slug IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO dojo.tags (
    slug,
    name,
    display_name,
    href,
    href_kind,
    is_clickable
  )
  VALUES (
    normalized_slug,
    normalized_slug,
    lower(COALESCE(NULLIF(btrim(p_clan_name), ''), normalized_slug)),
    '/cardattack/clans/' || normalized_slug,
    'clan',
    TRUE
  )
  -- Preserve existing canonical routes, labels, metadata and audit fields.
  ON CONFLICT (slug) DO NOTHING;
  -- The existing tags BEFORE trigger infers group/CardAttack identity metadata.
END;
$$;

CREATE OR REPLACE FUNCTION dojo.create_missing_clan_tag_from_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM dojo.create_missing_clan_tag(NEW.tag_slug, NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_missing_clan_tag ON dojo.clan;
CREATE TRIGGER trg_create_missing_clan_tag
AFTER INSERT OR UPDATE OF name, tag_slug
ON dojo.clan
FOR EACH ROW
WHEN (NEW.tag_slug IS NOT NULL AND btrim(NEW.tag_slug) <> '')
EXECUTE FUNCTION dojo.create_missing_clan_tag_from_row();

-- One-time backfill through the same helper; reruns do not overwrite tags.
DO $$
DECLARE
  clan_row RECORD;
BEGIN
  FOR clan_row IN
    SELECT clan.name, clan.tag_slug
    FROM dojo.clan AS clan
    WHERE NULLIF(btrim(clan.tag_slug), '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM dojo.tags AS tag WHERE tag.slug = clan.tag_slug
      )
  LOOP
    PERFORM dojo.create_missing_clan_tag(clan_row.tag_slug, clan_row.name);
  END LOOP;
END;
$$;

COMMIT;
