-- 004_add_release_date_to_shaolin_scrolls.sql
-- Purpose: Add a nullable release_date column to track when a scroll is officially released.
-- Rationale: Release date is set as the last step of the release process; NULL until finalized.
-- Verification:
--   psql $DATABASE_URL -c "ALTER TABLE dojo.shaolin_scrolls DROP COLUMN IF EXISTS release_date;" # optional cleanup in preview
--   psql $DATABASE_URL -f db/migrations/004_add_release_date_to_shaolin_scrolls.sql
--   psql $DATABASE_URL -c "\\d+ dojo.shaolin_scrolls"

ALTER TABLE dojo.shaolin_scrolls
  ADD COLUMN IF NOT EXISTS release_date DATE;

COMMENT ON COLUMN dojo.shaolin_scrolls.release_date IS 'Date when the release is finalized (nullable until final step)';

