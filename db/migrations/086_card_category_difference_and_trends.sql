-- Manual review/application only. Requires category migrations 083, 084 and 085.
-- Keep existing measurements intact; missing differences remain NULL.
BEGIN;
ALTER TABLE dojo.card_category_snapshot ADD COLUMN difference INTEGER;
COMMENT ON COLUMN dojo.card_category_snapshot.difference IS
  'Optional signed TCDb difference, recorded as shown by the source on measured_on. NULL means not recorded.';
-- Match homie/clan rank-first, then signed-difference overall trends when comparable.
-- Preserve unknown baselines; use bigint subtraction for the full signed-int range.
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
COMMIT;
