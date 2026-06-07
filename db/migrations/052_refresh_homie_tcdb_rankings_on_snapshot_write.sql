-- 052_refresh_homie_tcdb_rankings_on_snapshot_write.sql
-- Purpose: Keep homie TCDB realtime tables current after source snapshot writes.

SET search_path = dojo, public;

CREATE OR REPLACE FUNCTION refresh_homie_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  PERFORM refresh_homie_tcdb_ranking_rt();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_homie_tcdb_rankings_after_snapshot_write
ON homie_tcdb_snapshot;

CREATE TRIGGER trg_refresh_homie_tcdb_rankings_after_snapshot_write
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON homie_tcdb_snapshot
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_homie_tcdb_rankings_after_snapshot_write();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT EXECUTE ON FUNCTION refresh_homie_tcdb_rankings_after_snapshot_write() TO app_user;
  END IF;
END;
$$;

SELECT refresh_homie_tcdb_ranking_rt();
