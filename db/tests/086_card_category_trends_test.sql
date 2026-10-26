-- MANUAL ONLY, NON-PRODUCTION ONLY. Writes fixtures; always ROLLBACK.
-- Run after manually applying 083, 084, 085 and 086. Never run by npm validation.
BEGIN;
DO $$
DECLARE
  category BIGINT;
  example RECORD;
  actual RECORD;
  fixture_number INTEGER := 0;
BEGIN
  FOR example IN
    SELECT * FROM (VALUES
      -- name, previous rank, rank, previous difference, difference,
      -- expected rank trend, overall trend, difference delta, sign crossing
      ('rank-up-wins', 100, 90, 10, -10, 'up', 'up', -20::bigint, TRUE),
      ('rank-down-wins', 90, 100, -10, 10, 'down', 'down', 20::bigint, TRUE),
      ('gap-up', 100, 100, -20, -10, 'flat', 'up', 10::bigint, FALSE),
      ('gap-down', 100, 100, -10, -20, 'flat', 'down', -10::bigint, FALSE),
      ('unchanged', 100, 100, 0, 0, 'flat', 'flat', 0::bigint, FALSE),
      ('cross-to-zero', 100, 100, -1, 0, 'flat', 'up', 1::bigint, TRUE),
      ('cross-from-zero', 100, 100, 0, -1, 'flat', 'down', -1::bigint, TRUE),
      ('unknown-gap', 100, 100, NULL, 10, 'flat', NULL, NULL::bigint, NULL::boolean),
      ('cleared-gap', 100, 100, 10, NULL, 'flat', NULL, NULL::bigint, NULL::boolean),
      ('known-rank-move', 100, 90, NULL, NULL, 'up', 'up', NULL::bigint, NULL::boolean),
      ('missing-rank', NULL, 90, 0, 10, NULL, NULL, 10::bigint, FALSE),
      ('max-change', 100, 100, -2147483648, 2147483647, 'flat', 'up', 4294967295::bigint, TRUE),
      ('min-change', 100, 100, 2147483647, -2147483648, 'flat', 'down', -4294967295::bigint, TRUE)
    ) AS cases(name, previous_rank, rank, previous_difference, difference, rank_trend, overall_trend, delta, sign_crossed)
  LOOP
    fixture_number := fixture_number + 1;
    INSERT INTO dojo.card_category (slug, name)
      VALUES ('category-trend-fixture-086-' || fixture_number, example.name) RETURNING id INTO category;
    INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking, difference)
      VALUES (category, '2026-10-01', 12000, example.previous_rank, example.previous_difference),
             (category, '2026-10-20', 12125, example.rank, example.difference);
    SELECT * INTO actual FROM dojo.v_card_category_current WHERE category_id = category;
    IF actual.trend_rank IS DISTINCT FROM example.rank_trend
      OR actual.trend_overall IS DISTINCT FROM example.overall_trend
      OR actual.diff_delta IS DISTINCT FROM example.delta
      OR actual.diff_sign_changed IS DISTINCT FROM example.sign_crossed THEN
      RAISE EXCEPTION 'Trend parity failed for %', example.name;
    END IF;
    SELECT * INTO actual FROM dojo.v_card_category_snapshot
      WHERE category_id = category AND measured_on = '2026-10-01';
    IF actual.diff_delta IS NOT NULL OR actual.trend_rank IS NOT NULL
      OR actual.trend_overall IS NOT NULL OR actual.diff_sign_changed IS NOT NULL THEN
      RAISE EXCEPTION 'First measurement invented comparisons for %', example.name;
    END IF;
  END LOOP;

  INSERT INTO dojo.card_category (slug, name) VALUES ('category-backdate-fixture-086', 'Backdated differences') RETURNING id INTO category;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking, difference)
    VALUES (category, '2026-10-01', 12000, 100, -100), (category, '2026-10-20', 12125, 100, -20);
  IF (SELECT diff_delta FROM dojo.v_card_category_current WHERE category_id = category) IS DISTINCT FROM 80::bigint THEN
    RAISE EXCEPTION 'Initial difference delta failed';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking, difference)
    VALUES (category, '2026-10-10', 12050, 100, -50);
  SELECT * INTO actual FROM dojo.v_card_category_current WHERE category_id = category;
  IF actual.measured_on IS DISTINCT FROM DATE '2026-10-20' OR actual.diff_delta IS DISTINCT FROM 30::bigint THEN
    RAISE EXCEPTION 'Backdated difference did not update latest comparison';
  END IF;
  UPDATE dojo.card_category_snapshot SET difference = 0 WHERE category_id = category AND measured_on = '2026-10-10';
  SELECT * INTO actual FROM dojo.v_card_category_current WHERE category_id = category;
  IF actual.diff_delta IS DISTINCT FROM -20::bigint OR actual.trend_overall IS DISTINCT FROM 'down'
    OR actual.diff_sign_changed IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Correction did not update subsequent trends';
  END IF;
END $$;
ROLLBACK;
