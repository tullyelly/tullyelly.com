-- 046_add_set_collector_slug.sql
-- Add a stable public slug to Set Collector headers so detail routes and MDX
-- embeds no longer depend on numeric ids.

SET search_path = dojo, auth, public;

BEGIN;

ALTER TABLE dojo.set_collector_header
  ADD COLUMN IF NOT EXISTS set_slug TEXT;

WITH normalized AS (
  SELECT
    header.id,
    CASE
      WHEN counts.slug_count = 1 THEN base.base_slug
      ELSE CONCAT(base.base_slug, '-', header.id::TEXT)
    END AS resolved_slug
  FROM dojo.set_collector_header AS header
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(
        NULLIF(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              LOWER(
                BTRIM(COALESCE(NULLIF(BTRIM(header.set_slug), ''), header.set_name))
              ),
              '[^a-z0-9]+',
              '-',
              'g'
            ),
            '(^-+|-+$)',
            '',
            'g'
          ),
          ''
        ),
        'set'
      ) AS base_slug
  ) AS base
  CROSS JOIN LATERAL (
    SELECT COUNT(*) AS slug_count
    FROM dojo.set_collector_header AS dup
    CROSS JOIN LATERAL (
      SELECT
        COALESCE(
          NULLIF(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                LOWER(BTRIM(COALESCE(NULLIF(BTRIM(dup.set_slug), ''), dup.set_name))),
                '[^a-z0-9]+',
                '-',
                'g'
              ),
              '(^-+|-+$)',
              '',
              'g'
            ),
            ''
          ),
          'set'
        ) AS base_slug
    ) AS dup_base
    WHERE dup_base.base_slug = base.base_slug
  ) AS counts
)
UPDATE dojo.set_collector_header AS header
SET set_slug = normalized.resolved_slug
FROM normalized
WHERE header.id = normalized.id
  AND header.set_slug IS DISTINCT FROM normalized.resolved_slug;

ALTER TABLE dojo.set_collector_header
  ALTER COLUMN set_slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_set_slug_key'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_set_slug_key
    UNIQUE (set_slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'set_collector_header_set_slug_check'
      AND conrelid = 'dojo.set_collector_header'::regclass
  ) THEN
    ALTER TABLE dojo.set_collector_header
    ADD CONSTRAINT set_collector_header_set_slug_check
    CHECK (set_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END
$$;

COMMENT ON TABLE dojo.set_collector_header IS
  'Tracked card-set headers keyed by an internal numeric id and a stable public set_slug used by detail routes and MDX embeds.';

COMMENT ON COLUMN dojo.set_collector_header.id IS
  'Internal numeric key for snapshot foreign keys and admin-side lookups.';

COMMENT ON COLUMN dojo.set_collector_header.set_slug IS
  'Stable normalized slug used by the public /cardattack/set-collector/[id] route and <SetCollector set="..."> MDX embeds.';

COMMIT;
