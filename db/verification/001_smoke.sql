BEGIN;

-- Resolve status/type IDs
WITH stat AS (
  SELECT id AS status_id FROM dojo.release_status WHERE code = 'planned'
)
-- Insert a planned minor release: 1.0.0 (Aug 2025)
INSERT INTO dojo.shaolin_scrolls
  (major, minor, patch, year, month, label, release_status_id, release_type_id)
SELECT
  1, 0, 0, 2025, 8, 'Initial minor release',
  (SELECT status_id FROM stat),
  (SELECT id FROM dojo.release_type WHERE code = 'minor');

-- Insert a hotfix: 1.0.1 (Aug 2025)
INSERT INTO dojo.shaolin_scrolls
  (major, minor, patch, year, month, label, release_status_id, release_type_id)
SELECT
  1, 0, 1, 2025, 8, 'Login fix',
  (SELECT id FROM dojo.release_status WHERE code = 'planned'),
  (SELECT id FROM dojo.release_type   WHERE code = 'hotfix');

-- Validate view output, semver + generated_name, and audit stamps
SELECT
  id, major, minor, patch, year, month, status, release_type,
  semver, generated_name, created_at, created_by, updated_at, updated_by
FROM dojo.v_shaolin_scrolls
ORDER BY id DESC
LIMIT 5;

-- Update one row to test updated_* audit fields
UPDATE dojo.shaolin_scrolls
   SET label = 'Login fix (cookie path)'
 WHERE major = 1 AND minor = 0 AND patch = 1;

-- Check audit updated_at/updated_by flipped
SELECT id, label, created_at, updated_at, created_by, updated_by
FROM dojo.shaolin_scrolls
WHERE major = 1 AND minor = 0 AND patch = 1;

-- Negative test (should violate uq_semver)
-- INSERT INTO dojo.shaolin_scrolls
--   (major, minor, patch, year, month, label, release_status_id, release_type_id)
-- SELECT 1,0,0,2025,8,'Duplicate 1.0.0',
--        (SELECT id FROM dojo.release_status WHERE code = 'planned'),
--        (SELECT id FROM dojo.release_type   WHERE code = 'minor');

ROLLBACK;
