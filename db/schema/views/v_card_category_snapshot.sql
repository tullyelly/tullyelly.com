CREATE OR REPLACE VIEW dojo.v_card_category_snapshot AS
SELECT category.id AS category_id, category.slug, category.name,
  snapshot.id AS snapshot_id, snapshot.measured_on, snapshot.card_count,
  lag(snapshot.measured_on) OVER chronology AS previous_date,
  lag(snapshot.card_count) OVER chronology AS previous_count,
  snapshot.card_count - lag(snapshot.card_count) OVER chronology AS count_change,
  snapshot.ranking,
  lag(snapshot.ranking) OVER chronology AS previous_ranking,
  lag(snapshot.ranking) OVER chronology - snapshot.ranking AS rank_delta,
  CASE
    WHEN snapshot.ranking IS NULL OR lag(snapshot.ranking) OVER chronology IS NULL THEN NULL
    WHEN snapshot.ranking < lag(snapshot.ranking) OVER chronology THEN 'up'
    WHEN snapshot.ranking > lag(snapshot.ranking) OVER chronology THEN 'down'
    ELSE 'flat'
  END AS trend_rank,
  snapshot.difference,
  lag(snapshot.difference) OVER chronology AS previous_difference,
  snapshot.difference::bigint - (lag(snapshot.difference) OVER chronology)::bigint AS diff_delta,
  CASE
    WHEN snapshot.ranking IS NULL OR lag(snapshot.ranking) OVER chronology IS NULL THEN NULL
    WHEN snapshot.ranking < lag(snapshot.ranking) OVER chronology THEN 'up'
    WHEN snapshot.ranking > lag(snapshot.ranking) OVER chronology THEN 'down'
    WHEN snapshot.difference IS NULL OR lag(snapshot.difference) OVER chronology IS NULL THEN NULL
    WHEN snapshot.difference > lag(snapshot.difference) OVER chronology THEN 'up'
    WHEN snapshot.difference < lag(snapshot.difference) OVER chronology THEN 'down'
    ELSE 'flat'
  END AS trend_overall,
  CASE
    WHEN snapshot.difference IS NULL OR lag(snapshot.difference) OVER chronology IS NULL THEN NULL
    WHEN ((lag(snapshot.difference) OVER chronology) < 0 AND snapshot.difference >= 0)
      OR ((lag(snapshot.difference) OVER chronology) >= 0 AND snapshot.difference < 0) THEN TRUE
    ELSE FALSE
  END AS diff_sign_changed
FROM dojo.card_category AS category
JOIN dojo.card_category_snapshot AS snapshot ON snapshot.category_id = category.id
WINDOW chronology AS (PARTITION BY category.id ORDER BY snapshot.measured_on);
ALTER VIEW dojo.v_card_category_snapshot OWNER TO tullyelly_admin;
