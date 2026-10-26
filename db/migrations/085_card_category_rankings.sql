-- Manual review/application only. Apply after 083 and 084.
-- Existing count-only measurements stay unranked; do not infer historical rankings.
BEGIN;
ALTER TABLE dojo.card_category_snapshot
  ADD COLUMN ranking INTEGER CONSTRAINT card_category_snapshot_ranking_check CHECK (ranking >= 1);
COMMENT ON COLUMN dojo.card_category_snapshot.ranking IS
  'Optional TCDb category rank recorded on measured_on; lower is better. NULL means not recorded.';
-- Append view columns so existing dependents and grants are retained.
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
  END AS trend_rank
FROM dojo.card_category AS category
JOIN dojo.card_category_snapshot AS snapshot ON snapshot.category_id = category.id
WINDOW chronology AS (PARTITION BY category.id ORDER BY snapshot.measured_on);
ALTER VIEW dojo.v_card_category_snapshot OWNER TO tullyelly_admin;
CREATE OR REPLACE VIEW dojo.v_card_category_current AS
SELECT category.id AS category_id, category.slug, category.name,
  latest.snapshot_id, latest.measured_on, latest.card_count,
  latest.previous_date, latest.previous_count, latest.count_change,
  latest.ranking, latest.previous_ranking, latest.rank_delta, latest.trend_rank
FROM dojo.card_category AS category
LEFT JOIN LATERAL (
  SELECT history.* FROM dojo.v_card_category_snapshot AS history
  WHERE history.category_id = category.id
  ORDER BY history.measured_on DESC LIMIT 1
) AS latest ON TRUE;
ALTER VIEW dojo.v_card_category_current OWNER TO tullyelly_admin;
COMMIT;
