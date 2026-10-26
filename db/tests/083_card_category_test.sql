-- MANUAL ONLY, NON-PRODUCTION ONLY. Contains fixture writes; always ROLLBACK.
-- Run after manually applying 083 and 084. Never invoked by npm validation.
BEGIN;
DO $$
DECLARE
  category BIGINT;
  latest RECORD;
BEGIN
  INSERT INTO dojo.card_category (slug, name) VALUES ('category-fixture-083', 'Category fixture') RETURNING id INTO category;
  IF (SELECT card_count FROM dojo.v_card_category_current WHERE category_id = category) IS NOT NULL THEN
    RAISE EXCEPTION 'Untracked category must not become zero';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count)
  VALUES (category, '2026-10-01', 12000);
  IF (SELECT count_change FROM dojo.v_card_category_current WHERE category_id = category) IS NOT NULL THEN
    RAISE EXCEPTION 'First snapshot must not invent a comparison';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count)
  VALUES (category, '2026-10-20', 12125);
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.card_count IS DISTINCT FROM 12125 OR latest.count_change IS DISTINCT FROM 125 THEN RAISE EXCEPTION 'Initial comparison failed'; END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count)
  VALUES (category, '2026-10-10', 12050);
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.card_count IS DISTINCT FROM 12125 OR latest.count_change IS DISTINCT FROM 75 OR latest.measured_on IS DISTINCT FROM DATE '2026-10-20' THEN
    RAISE EXCEPTION 'Backdated comparison failed';
  END IF;
  UPDATE dojo.card_category_snapshot SET card_count = 12060 WHERE category_id = category AND measured_on = '2026-10-10';
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.card_count IS DISTINCT FROM 12125 OR latest.count_change IS DISTINCT FROM 65 THEN RAISE EXCEPTION 'Correction comparison failed'; END IF;
  BEGIN
    INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count) VALUES (category, '2026-10-20', 99);
    RAISE EXCEPTION 'Duplicate date accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT card_count FROM dojo.v_card_category_current WHERE category_id = category) IS DISTINCT FROM 12125 THEN
    RAISE EXCEPTION 'Duplicate changed existing count';
  END IF;
  INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count) VALUES (category, '2026-10-21', 0), (category, '2026-10-22', 0);
  IF (SELECT count_change FROM dojo.v_card_category_snapshot WHERE category_id = category AND measured_on = '2026-10-21') IS DISTINCT FROM -12125 THEN
    RAISE EXCEPTION 'Decreased count failed';
  END IF;
  SELECT * INTO latest FROM dojo.v_card_category_current WHERE category_id = category;
  IF latest.card_count IS DISTINCT FROM 0 OR latest.count_change IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'Zero or unchanged count failed'; END IF;
  BEGIN
    INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count) VALUES (category, '2026-10-23', -1);
    RAISE EXCEPTION 'Negative count accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count) VALUES (category, '9999-01-01', 1);
    RAISE EXCEPTION 'Future measurement accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
ROLLBACK;
