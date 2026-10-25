-- Run manually after migration 079 against a non-production database.
-- All fixture changes are rolled back; fixture slugs must be unused.
BEGIN;

DO $test$
DECLARE
  tag_row dojo.tags%ROWTYPE;
  preserved_row dojo.tags%ROWTYPE;
  clan_id BIGINT;
  partner_id BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'dojo.clan'::regclass AND attname = 'tag_slug'
      AND NOT attisdropped
  ) OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'dojo' AND table_name = 'v_clan_tcdb_snapshot'
      AND column_name = 'clan_tag_slug'
  ) THEN
    RAISE EXCEPTION 'legacy clan identity columns remain';
  END IF;

  -- Every pre-existing clan should have been included in the slug backfill.
  IF EXISTS (
    SELECT 1 FROM dojo.clan AS clan
    WHERE NOT EXISTS (SELECT 1 FROM dojo.tags AS tag WHERE tag.slug = clan.slug)
  ) THEN
    RAISE EXCEPTION 'existing clan is missing its canonical slug tag';
  END IF;

  IF EXISTS (SELECT 1 FROM dojo.tags WHERE slug LIKE 'migration-079-%')
     OR EXISTS (SELECT 1 FROM dojo.clan WHERE slug LIKE 'migration-079-%')
     OR EXISTS (SELECT 1 FROM dojo.tcdb_trade_partner WHERE tcdb_username = 'migration-079-partner') THEN
    RAISE EXCEPTION 'migration 079 fixture identities must be unused';
  END IF;

  -- No tag_slug is provided: this reproduces the missing Portland case.
  INSERT INTO dojo.clan (name, slug)
  VALUES ('  Portland Trail Blazers  ', 'migration-079-blazers')
  RETURNING id INTO clan_id;
  SELECT * INTO STRICT tag_row FROM dojo.tags WHERE slug = 'migration-079-blazers';
  IF tag_row.name IS DISTINCT FROM 'migration-079-blazers'
     OR tag_row.display_name IS DISTINCT FROM 'portland trail blazers'
     OR tag_row.href IS DISTINCT FROM '/cardattack/clans/migration-079-blazers'
     OR tag_row.href_kind IS DISTINCT FROM 'clan'
     OR tag_row.is_clickable IS DISTINCT FROM TRUE
     OR tag_row.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
     OR tag_row.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan'
     OR tag_row.created_at IS NULL OR tag_row.created_by IS NULL THEN
    RAISE EXCEPTION 'slug-only insert did not create the expected clan tag';
  END IF;

  -- The dependent content-tag view must now resolve a clan by slug.
  INSERT INTO dojo.tcdb_trade_partner (tcdb_username)
  VALUES ('migration-079-partner') RETURNING id INTO partner_id;
  INSERT INTO dojo.tcdb_trade_partner_clan (trade_partner_id, clan_id)
  VALUES (partner_id, clan_id);
  IF NOT EXISTS (
    SELECT 1 FROM dojo.v_tcdb_trade_partner_content_tags
    WHERE trade_partner_id = partner_id AND source_id = clan_id
      AND source_type = 'clan' AND slug = 'migration-079-blazers'
  ) THEN
    RAISE EXCEPTION 'trade-partner view does not resolve canonical clan tags';
  END IF;

  -- Existing tag records survive both name changes and repeated backfills.
  preserved_row := tag_row;
  UPDATE dojo.clan SET name = 'Changed Name' WHERE id = clan_id;
  PERFORM dojo.create_missing_clan_tag('migration-079-blazers', 'Another Name');
  SELECT * INTO STRICT tag_row FROM dojo.tags WHERE slug = 'migration-079-blazers';
  IF to_jsonb(tag_row) IS DISTINCT FROM to_jsonb(preserved_row) THEN
    RAISE EXCEPTION 'existing clan tag was changed';
  END IF;

  UPDATE dojo.clan SET slug = 'migration-079-renamed' WHERE id = clan_id;
  IF NOT EXISTS (SELECT 1 FROM dojo.tags WHERE slug = 'migration-079-renamed')
     OR NOT EXISTS (SELECT 1 FROM dojo.tags WHERE slug = 'migration-079-blazers') THEN
    RAISE EXCEPTION 'slug change must create its tag and retain the previous tag';
  END IF;

  INSERT INTO dojo.tags (slug, name, display_name, href, href_kind, is_clickable, meta)
  VALUES ('migration-079-existing', 'Keep Name', 'Keep Label', '/keep-route',
          'custom', FALSE, '{"keep":true}'::jsonb);
  SELECT * INTO STRICT preserved_row FROM dojo.tags WHERE slug = 'migration-079-existing';
  INSERT INTO dojo.clan (name, slug) VALUES ('Keep It', 'migration-079-existing');
  SELECT * INTO STRICT tag_row FROM dojo.tags WHERE slug = 'migration-079-existing';
  IF to_jsonb(tag_row) IS DISTINCT FROM to_jsonb(preserved_row) THEN
    RAISE EXCEPTION 'pre-existing custom tag was changed';
  END IF;
END;
$test$;

ROLLBACK;
