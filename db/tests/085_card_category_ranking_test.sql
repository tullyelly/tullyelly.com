-- MANUAL ONLY, NON-PRODUCTION ONLY. Fixture writes; always ROLLBACK.
-- Run after manually applying 083, 084 and 085. Never run by npm validation.
BEGIN;
DO $$
DECLARE
  category BIGINT;
  latest RECORD;
BEGIN
  INSERT INTO dojo.card_category (slug, name) VALUES ('category-rank-fixture-085', 'Ranking fixture') RETURNING id INTO category;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking)
  VALUES (category, '2026-10-01', 12000, 1500), (category, '2026-10-20', 12125, 1400);
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.ranking IS DISTINCT FROM 1400 OR latest.rank_delta IS DISTINCT FROM 100 OR latest.trend_rank IS DISTINCT FROM 'up' THEN
    RAISE EXCEPTION 'Initial ranking comparison failed';
  END IF;
  IF (SELECT trend_rank FROM dojo.v_card_category_snapshot WHERE category_id = category AND measured_on = '2026-10-01') IS NOT NULL THEN
    RAISE EXCEPTION 'First ranking must not have a fabricated flat trend';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking)
  VALUES (category, '2026-10-10', 12050, 1450);
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.ranking IS DISTINCT FROM 1400 OR latest.rank_delta IS DISTINCT FROM 50 OR latest.measured_on IS DISTINCT FROM DATE '2026-10-20' THEN
    RAISE EXCEPTION 'Backdated ranking changed current date or comparison incorrectly';
  END IF;
  UPDATE dojo.card_category_snapshot SET card_count = 12060, ranking = 1440
  WHERE category_id = category AND measured_on = '2026-10-10';
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.count_change IS DISTINCT FROM 65 OR latest.rank_delta IS DISTINCT FROM 40 THEN
    RAISE EXCEPTION 'Historical correction did not update count and ranking comparisons';
  END IF;
  UPDATE dojo.card_category_snapshot SET ranking = NULL WHERE category_id = category AND measured_on = '2026-10-10';
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.previous_ranking IS NOT NULL OR latest.rank_delta IS NOT NULL OR latest.trend_rank IS NOT NULL THEN
    RAISE EXCEPTION 'Missing ranking must break comparisons';
  END IF;
  UPDATE dojo.card_category_snapshot SET ranking = 1400 WHERE category_id = category AND measured_on = '2026-10-10';
  IF (SELECT trend_rank FROM dojo.v_card_category_current WHERE category_id = category) IS DISTINCT FROM 'flat' THEN
    RAISE EXCEPTION 'Unchanged rank comparison failed';
  END IF;
  UPDATE dojo.card_category_snapshot SET ranking = 1300 WHERE category_id = category AND measured_on = '2026-10-10';
  IF (SELECT rank_delta FROM dojo.v_card_category_current WHERE category_id = category) IS DISTINCT FROM -100
    OR (SELECT trend_rank FROM dojo.v_card_category_current WHERE category_id = category) IS DISTINCT FROM 'down' THEN
    RAISE EXCEPTION 'Worse rank comparison failed';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count) VALUES (category, '2026-10-21', 0);
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.card_count IS DISTINCT FROM 0 OR latest.ranking IS NOT NULL OR latest.rank_delta IS NOT NULL OR latest.trend_rank IS NOT NULL THEN
    RAISE EXCEPTION 'Count-only snapshot must not inherit a previous ranking';
  END IF;
  BEGIN
    INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking) VALUES (category, '2026-10-22', 0, 0);
    RAISE EXCEPTION 'Rank zero was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
ROLLBACK;
