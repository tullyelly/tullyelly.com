-- 051_refresh_clan_tcdb_rankings_on_snapshot_write.sql
-- Purpose: Keep clan TCDB realtime tables current after source snapshot writes.

SET search_path = dojo, public;

CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  PERFORM dojo.refresh_clan_tcdb_ranking_rt();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_clan_tcdb_rankings_after_snapshot_write
ON dojo.clan_tcdb_snapshot;

CREATE TRIGGER trg_refresh_clan_tcdb_rankings_after_snapshot_write
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON dojo.clan_tcdb_snapshot
FOR EACH STATEMENT
EXECUTE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT EXECUTE ON FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write() TO app_user;
  END IF;
END;
$$;

SELECT dojo.refresh_clan_tcdb_ranking_rt();
