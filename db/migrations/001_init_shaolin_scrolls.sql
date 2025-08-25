-- 001_init_shaolin_scrolls_normalized.sql
-- Purpose: normalized initial schema for shaolin_scrolls on PostgreSQL/Neon
-- Design: no ENUMs, no generated columns; lookup table + FK; view for presentation.

-- 0) Schema (namespaced home for app objects)
CREATE SCHEMA IF NOT EXISTS core;

-- 1) Lookup table for release types (instead of ENUM)
CREATE TABLE IF NOT EXISTS core.release_type (
  id   SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$')  -- e.g., planned/hotfix/minor/major
);

-- Seed values (safe to re-run)
INSERT INTO core.release_type (code) VALUES
  ('planned'), ('hotfix'), ('minor'), ('major')
ON CONFLICT (code) DO NOTHING;

-- 2) Main table
CREATE TABLE IF NOT EXISTS core.shaolin_scrolls (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label         TEXT NOT NULL,                                   -- optional human label you control
  release_date  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version       INT NOT NULL CHECK (version >= 0),
  patch         INT NOT NULL CHECK (patch   >= 0),
  release_type_id SMALLINT NOT NULL REFERENCES core.release_type(id),
  CONSTRAINT uq_release UNIQUE (version, patch, release_type_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_scrolls_release_key
  ON core.shaolin_scrolls (version, patch, release_type_id);
CREATE INDEX IF NOT EXISTS idx_scrolls_date
  ON core.shaolin_scrolls (release_date DESC);

-- 3) Read model: present friendly computed fields without storing them
CREATE OR REPLACE VIEW core.v_shaolin_scrolls AS
SELECT
  s.id,
  s.label,
  s.release_date,
  s.version,
  s.patch,
  rt.code                          AS release_type,
  'v' || s.version || '.' || s.patch || '-' || rt.code AS full_label
FROM core.shaolin_scrolls s
JOIN core.release_type rt ON rt.id = s.release_type_id;

-- 4) (Optional) Role quality-of-life: set search_path for your app role outside of migrations
-- ALTER ROLE tullyelly_admin IN DATABASE tullyelly_db SET search_path = core, public;

-- 5) (Optional) Minimal example write using the lookup
-- INSERT INTO core.shaolin_scrolls (label, version, patch, release_type_id)
-- SELECT 'v1.0', 1, 0, rt.id FROM core.release_type rt WHERE rt.code = 'minor';
