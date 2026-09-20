-- 072_create_clan_tcdb_snapshot_view.sql
-- Join clans to their TCDB snapshots with search-friendly clan names.

SET search_path = dojo, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_clan_tcdb_snapshot AS
SELECT
  clan.id AS clan_id,
  clan.name AS clan_name,
  lower(clan.name) AS clan_name_lower,
  clan.slug AS clan_slug,
  clan.tag_slug AS clan_tag_slug,
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

COMMIT;
