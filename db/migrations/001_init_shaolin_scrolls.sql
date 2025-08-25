-- 001_init_shaolin_scrolls.sql
-- Purpose: initial schema for shaolin_scrolls on PostgreSQL/Neon

-- 1) ENUM for release_type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'release_type_t') THEN
    CREATE TYPE release_type_t AS ENUM ('hotfix', 'minor', 'major');
  END IF;
END$$;

-- 2) Table definition
CREATE TABLE IF NOT EXISTS public.shaolin_scrolls (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INT NOT NULL CHECK (version >= 0),
  patch   INT NOT NULL CHECK (patch >= 0),
  release_type release_type_t NOT NULL,
  full_label TEXT GENERATED ALWAYS AS (
    'v' || version || '.' || patch || '-' || (release_type::TEXT)
  ) STORED,
  CONSTRAINT uq_release UNIQUE (version, patch, release_type)
);

-- 3) Trigger: keep label aligned with version.patch
CREATE OR REPLACE FUNCTION public.shaolin_set_label() RETURNS TRIGGER AS $$
BEGIN
  NEW.label := 'v' || NEW.version || '.' || NEW.patch;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shaolin_set_label_trg ON public.shaolin_scrolls;
CREATE TRIGGER shaolin_set_label_trg
BEFORE INSERT OR UPDATE OF version, patch ON public.shaolin_scrolls
FOR EACH ROW
EXECUTE FUNCTION public.shaolin_set_label();