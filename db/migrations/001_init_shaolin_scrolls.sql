-- 001_init_shaolin_scrolls_normalized.sql
-- Purpose: normalized initial schema for shaolin_scrolls on PostgreSQL/Neon
-- Design: no ENUMs, no generated columns; lookup table + FK; view for presentation.
-- Added: create/update audit columns + triggers on all tables.

-- 0) Schema (namespace for app objects)
CREATE SCHEMA IF NOT EXISTS core;

-- 1) Lookup table for release types
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

-- 2) Main table
CREATE TABLE IF NOT EXISTS core.shaolin_scrolls (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label           TEXT NOT NULL,
  release_date    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version         INT NOT NULL CHECK (version >= 0),
  patch           INT NOT NULL CHECK (patch >= 0),
  release_type_id SMALLINT NOT NULL REFERENCES core.release_type(id),
  CONSTRAINT uq_release UNIQUE (version, patch, release_type_id),

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at      TIMESTAMPTZ,
  updated_by      VARCHAR(100)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_scrolls_release_key
  ON core.shaolin_scrolls (version, patch, release_type_id);
CREATE INDEX IF NOT EXISTS idx_scrolls_date
  ON core.shaolin_scrolls (release_date DESC);

-- 2a) Audit trigger functions
CREATE OR REPLACE FUNCTION core.audit_stamp_release_type()
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

CREATE OR REPLACE FUNCTION core.audit_stamp_shaolin_scrolls()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := CURRENT_TIMESTAMP; END IF;
    IF NEW.created_by IS NULL THEN NEW.created_by := CURRENT_USER; END IF;
    -- keep existing release_date default as-is; it's independent of audit
    NEW.updated_at := NULL;
    NEW.updated_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
    NEW.updated_by := CURRENT_USER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2b) Audit triggers on all tables
DROP TRIGGER IF EXISTS trg_audit_release_type ON core.release_type;
CREATE TRIGGER trg_audit_release_type
BEFORE INSERT OR UPDATE ON core.release_type
FOR EACH ROW
EXECUTE FUNCTION core.audit_stamp_release_type();

DROP TRIGGER IF EXISTS trg_audit_shaolin_scrolls ON core.shaolin_scrolls;
CREATE TRIGGER trg_audit_shaolin_scrolls
BEFORE INSERT OR UPDATE ON core.shaolin_scrolls
FOR EACH ROW
EXECUTE FUNCTION core.audit_stamp_shaolin_scrolls();

-- 3) Read model view
CREATE OR REPLACE VIEW core.v_shaolin_scrolls AS
SELECT
  s.id,
  s.label,
  s.release_date,
  s.version,
  s.patch,
  rt.code AS release_type,
  'v' || s.version || '.' || s.patch || '-' || rt.code AS full_label
FROM core.shaolin_scrolls s
JOIN core.release_type rt ON rt.id = s.release_type_id;