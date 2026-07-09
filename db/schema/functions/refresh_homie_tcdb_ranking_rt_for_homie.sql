CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_ranking_rt(p_homie_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_homie_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM dojo.refresh_homie_tcdb_snapshot_rt(p_homie_id);

  DELETE FROM dojo.homie_tcdb_ranking_rt
  WHERE homie_id = p_homie_id;

  INSERT INTO dojo.homie_tcdb_ranking_rt (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM dojo.homie_tcdb_snapshot_rt
  WHERE homie_id = p_homie_id
  ORDER BY ranking_at DESC
  LIMIT 1;
END;
$$;
