CREATE OR REPLACE VIEW dojo.v_card_category_current AS
SELECT category.id AS category_id, category.slug, category.name,
  latest.snapshot_id, latest.measured_on, latest.card_count,
  latest.previous_date, latest.previous_count, latest.count_change,
  latest.ranking, latest.previous_ranking, latest.rank_delta, latest.trend_rank,
  latest.difference, latest.previous_difference, latest.diff_delta, latest.trend_overall, latest.diff_sign_changed
FROM dojo.card_category AS category
LEFT JOIN LATERAL (
  SELECT history.* FROM dojo.v_card_category_snapshot AS history
  WHERE history.category_id = category.id
  ORDER BY history.measured_on DESC LIMIT 1
) AS latest ON TRUE;
ALTER VIEW dojo.v_card_category_current OWNER TO tullyelly_admin;
