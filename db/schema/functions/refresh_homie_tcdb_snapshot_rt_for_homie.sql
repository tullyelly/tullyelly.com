CREATE OR REPLACE FUNCTION dojo.refresh_homie_tcdb_snapshot_rt(p_homie_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_homie_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM dojo.homie_tcdb_snapshot_rt
  WHERE homie_id = p_homie_id;

  INSERT INTO dojo.homie_tcdb_snapshot_rt (
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH snapshot_history AS (
    SELECT
      s.homie_id,
      s.card_count,
      s.ranking,
      s.difference,
      s.ranking_at,
      LAG(s.card_count) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_card_count,
      LAG(s.ranking) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking,
      LAG(s.difference) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_difference,
      LAG(s.ranking_at) OVER (PARTITION BY s.homie_id ORDER BY s.ranking_at) AS prev_ranking_at
    FROM dojo.homie_tcdb_snapshot AS s
    WHERE s.homie_id = p_homie_id
  ),
  final AS (
    SELECT
      h.id AS homie_id,
      h.name,
      sh.card_count,
      sh.ranking,
      sh.ranking_at,
      sh.difference,
      sh.prev_card_count,
      sh.prev_ranking,
      sh.prev_difference,
      sh.prev_ranking_at,
      (sh.card_count - sh.prev_card_count) AS card_count_delta,
      (sh.prev_ranking - sh.ranking) AS rank_delta,
      (sh.difference - sh.prev_difference) AS diff_delta,
      CASE
        WHEN sh.prev_ranking IS NULL THEN 'flat'
        WHEN (sh.prev_ranking - sh.ranking) > 0 THEN 'up'
        WHEN (sh.prev_ranking - sh.ranking) < 0 THEN 'down'
        ELSE 'flat'
      END AS trend_rank,
      CASE
        WHEN sh.prev_ranking IS NULL THEN 'flat'
        WHEN (sh.prev_ranking - sh.ranking) <> 0 THEN
          CASE WHEN (sh.prev_ranking - sh.ranking) > 0 THEN 'up' ELSE 'down' END
        WHEN (sh.difference - sh.prev_difference) IS NOT NULL
          AND (sh.difference - sh.prev_difference) <> 0 THEN
          CASE WHEN (sh.difference - sh.prev_difference) > 0 THEN 'up' ELSE 'down' END
        ELSE 'flat'
      END AS trend_overall,
      CASE
        WHEN sh.prev_difference IS NULL THEN FALSE
        WHEN (sh.prev_difference < 0 AND sh.difference >= 0)
          OR (sh.prev_difference >= 0 AND sh.difference < 0)
        THEN TRUE
        ELSE FALSE
      END AS diff_sign_changed
    FROM snapshot_history AS sh
    JOIN dojo.homie AS h ON h.id = sh.homie_id
  )
  SELECT
    homie_id, name, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;
