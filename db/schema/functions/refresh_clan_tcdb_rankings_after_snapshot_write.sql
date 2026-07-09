CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt();
    RETURN NULL;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt(OLD.clan_id, OLD.sport);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE')
    AND (
      TG_OP <> 'UPDATE'
      OR NEW.clan_id IS DISTINCT FROM OLD.clan_id
      OR NEW.sport IS DISTINCT FROM OLD.sport
    )
  THEN
    PERFORM dojo.refresh_clan_tcdb_ranking_rt(NEW.clan_id, NEW.sport);
  END IF;

  RETURN NULL;
END;
$$;
