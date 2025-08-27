-- db/migrations/003_semver_columns.sql
-- Adds generated semver components for robust ordering
-- Verification:
--   psql $DATABASE_URL -c "\\d+ releases"

ALTER TABLE releases
  ADD COLUMN IF NOT EXISTS semver_major int GENERATED ALWAYS AS (
    COALESCE(NULLIF(split_part(regexp_replace(version, '^[^0-9]*', ''), '.', 1), ''), '0')::int
  ) STORED,
  ADD COLUMN IF NOT EXISTS semver_minor int GENERATED ALWAYS AS (
    COALESCE(NULLIF(split_part(regexp_replace(version, '^[^0-9]*', ''), '.', 2), ''), '0')::int
  ) STORED,
  ADD COLUMN IF NOT EXISTS semver_patch int GENERATED ALWAYS AS (
    COALESCE(NULLIF(split_part(regexp_replace(version, '^[^0-9]*', ''), '.', 3), ''), '0')::int
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_releases_semver_desc
  ON releases (semver_major DESC, semver_minor DESC, semver_patch DESC);

