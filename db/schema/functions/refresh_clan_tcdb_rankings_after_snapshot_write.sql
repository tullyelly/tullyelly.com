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
