-- 002_fn_next_release.sql
-- Purpose: smoke-test fn_next_hotfix and fn_next_minor.
-- Run with: psql $DATABASE_URL -f db/verification/002_fn_next_release.sql
-- The transaction rolls back to avoid side effects.

BEGIN;

-- Seed a released baseline required for fn_next_hotfix
INSERT INTO dojo.shaolin_scrolls
  (major, minor, patch, year, month, label, release_status_id, release_type_id)
SELECT
  2, 0, 0,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  EXTRACT(MONTH FROM CURRENT_DATE)::INT,
  'Baseline release',
  (SELECT id FROM dojo.release_status WHERE code = 'released'),
  (SELECT id FROM dojo.release_type WHERE code = 'minor');

-- Next planned hotfix
SELECT * FROM dojo.fn_next_patch('First hotfix');
-- Expect: id plus generated_name like 'v2.0.1 First hotfix'

-- Next planned minor release
SELECT * FROM dojo.fn_next_minor('Next minor');
-- Expect: id plus generated_name like 'v2.1.0 Next minor'

ROLLBACK;
