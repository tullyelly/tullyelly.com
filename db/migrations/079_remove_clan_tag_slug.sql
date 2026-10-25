-- 079_remove_clan_tag_slug.sql
-- Make dojo.clan.slug the sole clan identity; preserve existing tags.
-- Follow migration 078. Run this complete transaction manually after review.
SET search_path = dojo, auth, public;

BEGIN;

LOCK TABLE dojo.clan IN SHARE ROW EXCLUSIVE MODE;

-- Do not silently discard unexpected populated legacy values.
DO $$
DECLARE
  has_legacy_values BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'dojo.clan'::regclass AND attname = 'tag_slug'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM dojo.clan WHERE tag_slug IS NOT NULL)'
      INTO has_legacy_values;
    IF has_legacy_values THEN
      RAISE EXCEPTION 'dojo.clan.tag_slug contains values; review them before removing the column';
    END IF;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_missing_clan_tag ON dojo.clan;
DROP FUNCTION IF EXISTS dojo.create_missing_clan_tag_from_row();
DROP FUNCTION IF EXISTS dojo.create_missing_clan_tag(TEXT, TEXT);

CREATE OR REPLACE FUNCTION dojo.create_missing_clan_tag(
  p_slug TEXT,
  p_clan_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_slug TEXT := NULLIF(btrim(p_slug), '');
BEGIN
  -- Use the required canonical clan slug for tag identity and routing.
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
  PERFORM dojo.create_missing_clan_tag(NEW.slug, NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_missing_clan_tag ON dojo.clan;
CREATE TRIGGER trg_create_missing_clan_tag
AFTER INSERT OR UPDATE OF name, slug
ON dojo.clan
FOR EACH ROW
WHEN (NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '')
EXECUTE FUNCTION dojo.create_missing_clan_tag_from_row();

-- One-time backfill through the same helper; reruns do not overwrite tags.
DO $$
DECLARE
  clan_row RECORD;
BEGIN
  FOR clan_row IN
    SELECT clan.name, clan.slug
    FROM dojo.clan AS clan
    WHERE NULLIF(btrim(clan.slug), '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM dojo.tags AS tag WHERE tag.slug = clan.slug
      )
  LOOP
    PERFORM dojo.create_missing_clan_tag(clan_row.slug, clan_row.name);
  END LOOP;
END;
$$;

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_partner_content_tags AS
SELECT link.trade_partner_id, tag.id AS tag_id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug) AS display_name,
  tag.href, tag.href_kind, 'homie'::TEXT AS source_type, link.homie_id AS source_id, NULL::TEXT AS tag_type
FROM dojo.tcdb_trade_partner_homie link JOIN dojo.homie homie ON homie.id = link.homie_id JOIN dojo.tags tag ON tag.slug = homie.tag_slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind, 'clan', link.clan_id, NULL::TEXT
FROM dojo.tcdb_trade_partner_clan link JOIN dojo.clan clan ON clan.id = link.clan_id JOIN dojo.tags tag ON tag.slug = clan.slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind, 'tag', NULL::BIGINT, link.tag_type
FROM dojo.tcdb_trade_partner_tag link JOIN dojo.tags tag ON tag.id = link.tag_id;

-- The snapshot view loses a column, which requires recreation. Keep its owner,
-- effective grants and view options; RESTRICT refuses unknown dependent objects.
CREATE TEMP TABLE clan_slug_snapshot_view_state ON COMMIT DROP AS
SELECT relowner, pg_get_userbyid(relowner) AS owner_name,
       COALESCE(relacl, acldefault('r', relowner)) AS acl, reloptions
FROM pg_class WHERE oid = to_regclass('dojo.v_clan_tcdb_snapshot');

CREATE TEMP TABLE clan_slug_snapshot_column_grants ON COMMIT DROP AS
SELECT attribute.attname, attribute.attacl
FROM pg_attribute AS attribute
WHERE attribute.attrelid = to_regclass('dojo.v_clan_tcdb_snapshot')
  AND attribute.attacl IS NOT NULL AND NOT attribute.attisdropped
  AND attribute.attname <> 'clan_tag_slug';

DROP VIEW IF EXISTS dojo.v_clan_tcdb_snapshot RESTRICT;

CREATE OR REPLACE VIEW dojo.v_clan_tcdb_snapshot AS
SELECT
  clan.id AS clan_id,
  clan.name AS clan_name,
  lower(clan.name) AS clan_name_lower,
  clan.slug AS clan_slug,
  clan.created_at AS clan_created_at,
  clan.created_by AS clan_created_by,
  clan.updated_at AS clan_updated_at,
  clan.updated_by AS clan_updated_by,
  snapshot.id AS snapshot_id,
  snapshot.clan_id AS snapshot_clan_id,
  snapshot.sport,
  snapshot.card_count,
  snapshot.ranking,
  snapshot.difference,
  snapshot.ranking_at,
  snapshot.created_at AS snapshot_created_at,
  snapshot.created_by AS snapshot_created_by,
  snapshot.updated_at AS snapshot_updated_at,
  snapshot.updated_by AS snapshot_updated_by
FROM dojo.clan AS clan
JOIN dojo.clan_tcdb_snapshot AS snapshot
  ON snapshot.clan_id = clan.id;

COMMENT ON VIEW dojo.v_clan_tcdb_snapshot IS
  'Clan details joined to TCDB snapshots; clan_name_lower supports case-normalized searches.';

DO $$
DECLARE
  view_state RECORD;
  grant_row RECORD;
  role_sql TEXT;
BEGIN
  SELECT * INTO view_state FROM clan_slug_snapshot_view_state;
  IF NOT FOUND THEN RETURN; END IF;

  -- Remove recreation-time defaults before restoring the original grants.
  FOR grant_row IN
    SELECT DISTINCT permission.grantee
    FROM pg_class AS relation
    CROSS JOIN LATERAL aclexplode(
      COALESCE(relation.relacl, acldefault('r', relation.relowner))
    ) AS permission
    WHERE relation.oid = 'dojo.v_clan_tcdb_snapshot'::regclass
  LOOP
    role_sql := CASE WHEN grant_row.grantee = 0 THEN 'PUBLIC'
      ELSE quote_ident(pg_get_userbyid(grant_row.grantee)) END;
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE dojo.v_clan_tcdb_snapshot FROM %s', role_sql);
  END LOOP;

  FOR grant_row IN SELECT * FROM aclexplode(view_state.acl)
  LOOP
    role_sql := CASE WHEN grant_row.grantee = 0 THEN 'PUBLIC'
      ELSE quote_ident(pg_get_userbyid(grant_row.grantee)) END;
    EXECUTE format('GRANT %s ON TABLE dojo.v_clan_tcdb_snapshot TO %s%s',
      grant_row.privilege_type, role_sql,
      CASE WHEN grant_row.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END);
  END LOOP;

  FOR grant_row IN
    SELECT column_grant.attname, permission.*
    FROM clan_slug_snapshot_column_grants AS column_grant
    CROSS JOIN LATERAL aclexplode(column_grant.attacl) AS permission
  LOOP
    role_sql := CASE WHEN grant_row.grantee = 0 THEN 'PUBLIC'
      ELSE quote_ident(pg_get_userbyid(grant_row.grantee)) END;
    EXECUTE format('GRANT %s (%I) ON TABLE dojo.v_clan_tcdb_snapshot TO %s%s',
      grant_row.privilege_type, grant_row.attname, role_sql,
      CASE WHEN grant_row.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END);
  END LOOP;

  IF view_state.reloptions IS NOT NULL THEN
    EXECUTE format('ALTER VIEW dojo.v_clan_tcdb_snapshot SET (%s)',
      array_to_string(view_state.reloptions, ', '));
  END IF;
  EXECUTE format('ALTER VIEW dojo.v_clan_tcdb_snapshot OWNER TO %I', view_state.owner_name);
END;
$$;

-- Both known view dependencies and the legacy trigger have now been replaced.
-- No CASCADE: an unrecognized dependency must roll back the whole migration.
ALTER TABLE dojo.clan DROP COLUMN IF EXISTS tag_slug RESTRICT;

COMMIT;
