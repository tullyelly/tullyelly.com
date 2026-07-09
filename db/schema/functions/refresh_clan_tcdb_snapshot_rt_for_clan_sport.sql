CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_snapshot_rt(
  p_clan_id BIGINT,
  p_sport TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_clan_id IS NULL OR NULLIF(BTRIM(p_sport), '') IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM dojo.clan_tcdb_snapshot_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport;

  INSERT INTO dojo.clan_tcdb_snapshot_rt (
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  WITH snapshot_history AS (
    SELECT
      s.clan_id,
      s.sport,
      s.card_count,
      s.ranking,
      s.difference,
      s.ranking_at,
      LAG(s.card_count) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_card_count,
      LAG(s.ranking) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_ranking,
      LAG(s.difference) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_difference,
      LAG(s.ranking_at) OVER (PARTITION BY s.clan_id, s.sport ORDER BY s.ranking_at) AS prev_ranking_at
    FROM dojo.clan_tcdb_snapshot AS s
    WHERE s.clan_id = p_clan_id
      AND s.sport = p_sport
  ),
  final AS (
    SELECT
      c.id AS clan_id,
      c.name,
      c.slug,
      sh.sport,
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
    JOIN dojo.clan AS c ON c.id = sh.clan_id
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_card_count, prev_ranking, prev_difference, prev_ranking_at,
    card_count_delta, rank_delta, diff_delta,
    trend_rank, trend_overall, diff_sign_changed, now()
  FROM final;
END;
$$;
