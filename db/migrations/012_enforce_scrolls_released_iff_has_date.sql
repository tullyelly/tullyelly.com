-- 012_enforce_scrolls_released_iff_has_date.sql
-- Rule: release_status_id = 2  ⇔  release_date IS NOT NULL

BEGIN;

ALTER TABLE dojo.shaolin_scrolls
  ADD CONSTRAINT chk_scrolls_released_iff_has_date
  CHECK ( (release_status_id = 2) = (release_date IS NOT NULL) )
  NOT VALID;

-- After fixing any violators:
ALTER TABLE dojo.shaolin_scrolls
  VALIDATE CONSTRAINT chk_scrolls_released_iff_has_date;

COMMIT;