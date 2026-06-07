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
