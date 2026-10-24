-- Run manually after migration 078 against a non-production database.
-- All fixture changes are rolled back. Fixture slugs must be unused.
BEGIN;

DO $test$
DECLARE
  tag_row dojo.tags%ROWTYPE;
  preserved_row dojo.tags%ROWTYPE;
  clan_id BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.tags WHERE slug LIKE 'migration-078-%'
  ) OR EXISTS (
    SELECT 1 FROM dojo.clan
    WHERE slug LIKE 'migration-078-%' OR tag_slug LIKE 'migration-078-%'
  ) THEN
    RAISE EXCEPTION 'migration 078 fixture slugs must be unused';
  END IF;

  -- Insert creates the screenshot fields and the existing identity metadata.
  INSERT INTO dojo.clan (name, slug, tag_slug)
  VALUES ('  Milwaukee Bucks  ', 'migration-078-route', 'migration-078-bucks');

  SELECT * INTO STRICT tag_row FROM dojo.tags WHERE slug = 'migration-078-bucks';
  IF tag_row.name IS DISTINCT FROM 'migration-078-bucks'
     OR tag_row.display_name IS DISTINCT FROM 'milwaukee bucks'
     OR tag_row.href IS DISTINCT FROM '/cardattack/clans/migration-078-bucks'
     OR tag_row.href_kind IS DISTINCT FROM 'clan'
     OR tag_row.is_clickable IS DISTINCT FROM TRUE
     OR tag_row.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
     OR tag_row.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan'
     OR tag_row.meta #>> '{identity,contexts,cardattack,href}'
          IS DISTINCT FROM '/cardattack/clans/migration-078-bucks'
     OR tag_row.created_at IS NULL OR tag_row.created_by IS NULL THEN
    RAISE EXCEPTION 'clan insert did not create the expected tag';
  END IF;

  -- Null/blank helper inputs are harmless; null clan slugs can be assigned later.
  PERFORM dojo.create_missing_clan_tag(NULL, 'Missing');
  PERFORM dojo.create_missing_clan_tag('   ', 'Missing');
  INSERT INTO dojo.clan (name, slug)
  VALUES ('Later Tag', 'migration-078-later-route') RETURNING id INTO clan_id;
  IF EXISTS (SELECT 1 FROM dojo.tags WHERE slug = 'migration-078-later-route') THEN
    RAISE EXCEPTION 'a null tag_slug must not fall back to the clan route slug';
  END IF;
  UPDATE dojo.clan SET tag_slug = 'migration-078-later' WHERE id = clan_id;
  IF NOT EXISTS (SELECT 1 FROM dojo.tags WHERE slug = 'migration-078-later') THEN
    RAISE EXCEPTION 'assigning tag_slug must create a missing tag';
  END IF;

  -- Existing tags, including custom routes and metadata, remain byte-for-byte intact.
  INSERT INTO dojo.tags (slug, name, display_name, href, href_kind, is_clickable, meta)
  VALUES ('migration-078-existing', 'Keep Name', 'Keep Label', '/keep-route',
          'custom', FALSE, '{"keep":true}'::jsonb);
  SELECT * INTO STRICT preserved_row FROM dojo.tags WHERE slug = 'migration-078-existing';
  INSERT INTO dojo.clan (name, slug, tag_slug)
  VALUES ('Replace Nothing', 'migration-078-existing-route', 'migration-078-existing');
  UPDATE dojo.clan SET name = 'Still Preserve' WHERE tag_slug = 'migration-078-existing';
  PERFORM dojo.create_missing_clan_tag('migration-078-existing', 'Backfill Again');
  SELECT * INTO STRICT tag_row FROM dojo.tags WHERE slug = 'migration-078-existing';
  IF to_jsonb(tag_row) IS DISTINCT FROM to_jsonb(preserved_row) THEN
    RAISE EXCEPTION 'existing tag was changed';
  END IF;

  -- Simulate a missing historical tag and exercise the backfill helper twice.
  DELETE FROM dojo.tags WHERE slug = 'migration-078-bucks';
  PERFORM dojo.create_missing_clan_tag(clan.tag_slug, clan.name)
  FROM dojo.clan AS clan WHERE clan.tag_slug = 'migration-078-bucks';
  PERFORM dojo.create_missing_clan_tag(clan.tag_slug, clan.name)
  FROM dojo.clan AS clan WHERE clan.tag_slug = 'migration-078-bucks';
  IF (SELECT count(*) FROM dojo.tags WHERE slug = 'migration-078-bucks') <> 1 THEN
    RAISE EXCEPTION 'repeated backfill must create exactly one tag';
  END IF;
END;
$test$;

ROLLBACK;
