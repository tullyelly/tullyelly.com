CREATE OR REPLACE FUNCTION dojo.refresh_clan_tcdb_ranking_rt(
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

  PERFORM dojo.refresh_clan_tcdb_snapshot_rt(p_clan_id, p_sport);

  DELETE FROM dojo.clan_tcdb_ranking_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport;

  INSERT INTO dojo.clan_tcdb_ranking_rt (
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, updated_at
  )
  SELECT
    clan_id, name, slug, sport, card_count, ranking, ranking_at, difference,
    prev_ranking, prev_difference, prev_ranking_at,
    rank_delta, diff_delta, trend_rank, trend_overall, diff_sign_changed, now()
  FROM dojo.clan_tcdb_snapshot_rt
  WHERE clan_id = p_clan_id
    AND sport = p_sport
  ORDER BY ranking_at DESC
  LIMIT 1;
END;
$$;
