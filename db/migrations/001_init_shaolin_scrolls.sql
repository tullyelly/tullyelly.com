-- 001_init_shaolin_scrolls_normalized.sql
-- Purpose: normalized initial schema for shaolin_scrolls on PostgreSQL/Neon
-- Design: no ENUMs, no generated columns; lookup tables + FKs; view for presentation.
-- Added: create/update audit columns + triggers on all tables.
-- Aligns columns with original MySQL schema: major, minor, patch, year, month, label, status, created/updated audits.
-- Preserves earlier release_type nuance as a separate lookup.

-- 0) Schema (namespace for app objects)
CREATE SCHEMA IF NOT EXISTS core;

-- 1) Lookup table for release types (planned/hotfix/minor/major nuance)
CREATE TABLE IF NOT EXISTS core.release_type (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$'),

  -- Audit
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at  TIMESTAMPTZ,
  updated_by  VARCHAR(100)
);

-- Seed values (safe to re-run)
INSERT INTO core.release_type (code) VALUES
  ('planned'), ('hotfix'), ('minor'), ('major')
ON CONFLICT (code) DO NOTHING;

-- 1b) Lookup table for release status (replaces MySQL ENUM('planned','released','archived'))
CREATE TABLE IF NOT EXISTS core.release_status (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$'),

  -- Audit
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at  TIMESTAMPTZ,
  updated_by  VARCHAR(100)
);

-- Seed values (safe to re-run)
INSERT INTO core.release_status (code) VALUES
  ('planned'), ('released'), ('archived')
ON CONFLICT (code) DO NOTHING;

-- 2) Main table (aligns with original: major, minor, patch, year, month, label, status; adds release_type linkage)
CREATE TABLE IF NOT EXISTS core.shaolin_scrolls (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Original MySQL columns (normalized to Postgres types)
  major             INT      NOT NULL CHECK (major >= 0),
  minor             INT      NOT NULL CHECK (minor >= 0),
  patch             INT      NOT NULL CHECK (patch >= 0),
  year              SMALLINT NOT NULL CHECK (year BETWEEN 1970 AND 9999),
  month             SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  label             VARCHAR(120) NOT NULL,

  -- Status (lookup)
  release_status_id SMALLINT NOT NULL REFERENCES core.release_status(id),

  -- Added: release_type nuance (lookup)
  release_type_id   SMALLINT NOT NULL REFERENCES core.release_type(id),

  -- Original uniqueness on semantic version
  CONSTRAINT uq_semver UNIQUE (major, minor, patch),

  -- Audit (mirrors MySQL created/updated fields)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by        VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at        TIMESTAMPTZ,
  updated_by        VARCHAR(100)
);

-- Helpful indexes (match original + practical additions)
-- Original: KEY ix_status (status)
CREATE INDEX IF NOT EXISTS ix_shaolin_status
  ON core.shaolin_scrolls (release_status_id);

-- Original: KEY ix_year_month (year, month)
CREATE INDEX IF NOT EXISTS ix_shaolin_year_month
  ON core.shaolin_scrolls (year, month);

-- Practical: quick access to semver tuple
CREATE INDEX IF NOT EXISTS ix_shaolin_semver
  ON core.shaolin_scrolls (major, minor, patch);

-- Practical: release_type filter
CREATE INDEX IF NOT EXISTS ix_shaolin_release_type
  ON core.shaolin_scrolls (release_type_id);

-- 2a) Audit trigger functions (shared pattern)
CREATE OR REPLACE FUNCTION core.audit_stamp_generic()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := CURRENT_TIMESTAMP; END IF;
    IF NEW.created_by IS NULL THEN NEW.created_by := CURRENT_USER; END IF;
    NEW.updated_at := NULL;
    NEW.updated_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
    NEW.updated_by := CURRENT_USER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2b) Attach audit triggers to lookup + main tables
DROP TRIGGER IF EXISTS trg_audit_release_type ON core.release_type;
CREATE TRIGGER trg_audit_release_type
BEFORE INSERT OR UPDATE ON core.release_type
FOR EACH ROW
EXECUTE FUNCTION core.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_release_status ON core.release_status;
CREATE TRIGGER trg_audit_release_status
BEFORE INSERT OR UPDATE ON core.release_status
FOR EACH ROW
EXECUTE FUNCTION core.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_shaolin_scrolls ON core.shaolin_scrolls;
CREATE TRIGGER trg_audit_shaolin_scrolls
BEFORE INSERT OR UPDATE ON core.shaolin_scrolls
FOR EACH ROW
EXECUTE FUNCTION core.audit_stamp_generic();

-- 3) Read model view
-- Mirrors original "generated_name" concept as a computed presentation, without storing:
-- 'shaolin {major}.{minor}.{patch} – {year}-{LPAD(month,2)} {maybe_hotfix_prefix}{label}'
-- where we prefix 'hotfix: ' if patch > 0 AND label does not already contain 'hotfix' (case-insensitive).
CREATE OR REPLACE VIEW core.v_shaolin_scrolls AS
SELECT
  s.id,
  s.major,
  s.minor,
  s.patch,
  s.year,
  s.month,
  s.label,
  rs.code AS status,
  rt.code AS release_type,
  s.created_at,
  s.created_by,
  s.updated_at,
  s.updated_by,

  -- Friendly strings for UI/queries
  ('shaolin ' || s.major || '.' || s.minor || '.' || s.patch
    || ' – ' || s.year || '-' || LPAD(s.month::text, 2, '0') || ' '
    || CASE
         WHEN s.patch > 0 AND POSITION('hotfix' IN LOWER(s.label)) = 0
           THEN 'hotfix: ' || s.label
         ELSE s.label
       END
  ) AS generated_name,

  -- Minimal "vX.Y.Z" string, often useful
  ('v' || s.major || '.' || s.minor || '.' || s.patch) AS semver
FROM core.shaolin_scrolls s
JOIN core.release_status rs ON rs.id = s.release_status_id
JOIN core.release_type   rt ON rt.id = s.release_type_id;