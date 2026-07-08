CREATE OR REPLACE FUNCTION refresh_homie_tcdb_rankings_after_snapshot_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = dojo, public
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt();
    RETURN NULL;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt(OLD.homie_id);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE')
    AND (TG_OP <> 'UPDATE' OR NEW.homie_id IS DISTINCT FROM OLD.homie_id)
  THEN
    PERFORM dojo.refresh_homie_tcdb_ranking_rt(NEW.homie_id);
  END IF;

  RETURN NULL;
END;
$$;
