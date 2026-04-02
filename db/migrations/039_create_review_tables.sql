-- 039_create_review_tables.sql
-- Normalize ReleaseSection review metadata into shared review type, subject,
-- and reference tables while keeping rendered narrative content in MDX files.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.review_type (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  singular_label TEXT NOT NULL,
  collection_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.review_type
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS singular_label TEXT,
  ADD COLUMN IF NOT EXISTS collection_path TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.review_type
SET
  sort_order = COALESCE(sort_order, 0),
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE sort_order IS NULL
   OR created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.review_type
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN label SET NOT NULL,
  ALTER COLUMN singular_label SET NOT NULL,
  ALTER COLUMN collection_path SET NOT NULL,
  ALTER COLUMN sort_order SET DEFAULT 0,
  ALTER COLUMN sort_order SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_type_slug_key'
      AND conrelid = 'dojo.review_type'::regclass
  ) THEN
    ALTER TABLE dojo.review_type
    ADD CONSTRAINT review_type_slug_key
    UNIQUE (slug);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_type_sort_order_check'
      AND conrelid = 'dojo.review_type'::regclass
  ) THEN
    ALTER TABLE dojo.review_type
    ADD CONSTRAINT review_type_sort_order_check
    CHECK (sort_order >= 0);
  END IF;
END
$$;

COMMENT ON TABLE dojo.review_type IS
  'Catalog of normalized ReleaseSection review kinds; MDX body content remains the source of truth for rendered prose.';

COMMENT ON COLUMN dojo.review_type.slug IS
  'Stable review type slug passed from ReleaseSection review.type.';

COMMENT ON COLUMN dojo.review_type.label IS
  'Plural display label for review collections.';

COMMENT ON COLUMN dojo.review_type.singular_label IS
  'Singular display label for a review subject.';

COMMENT ON COLUMN dojo.review_type.collection_path IS
  'Public collection route path for the review type.';

COMMENT ON COLUMN dojo.review_type.sort_order IS
  'Menu and UI ordering hint for review type collections.';

CREATE TABLE IF NOT EXISTS dojo.review_subject (
  id SERIAL PRIMARY KEY,
  review_type_id INTEGER NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.review_subject
  ADD COLUMN IF NOT EXISTS review_type_id INTEGER,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.review_subject
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.review_subject
  ALTER COLUMN review_type_id SET NOT NULL,
  ALTER COLUMN external_id SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_subject_review_type_id_fkey'
      AND conrelid = 'dojo.review_subject'::regclass
  ) THEN
    ALTER TABLE dojo.review_subject
    ADD CONSTRAINT review_subject_review_type_id_fkey
    FOREIGN KEY (review_type_id)
    REFERENCES dojo.review_type(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_subject_review_type_external_id_key'
      AND conrelid = 'dojo.review_subject'::regclass
  ) THEN
    ALTER TABLE dojo.review_subject
    ADD CONSTRAINT review_subject_review_type_external_id_key
    UNIQUE (review_type_id, external_id);
  END IF;
END
$$;

COMMENT ON TABLE dojo.review_subject IS
  'Normalized review subject header keyed by review type and the stable external ReleaseSection review.id value.';

COMMENT ON COLUMN dojo.review_subject.review_type_id IS
  'Foreign key to dojo.review_type for the normalized review type.';

COMMENT ON COLUMN dojo.review_subject.external_id IS
  'Stable external identifier passed from MDX ReleaseSection review.id; never used as the internal primary key.';

COMMENT ON COLUMN dojo.review_subject.name IS
  'Optional subject display name copied from ReleaseSection review.name metadata.';

COMMENT ON COLUMN dojo.review_subject.url IS
  'Optional canonical subject URL copied from ReleaseSection review.url metadata.';

CREATE TABLE IF NOT EXISTS dojo.review_reference (
  id SERIAL PRIMARY KEY,
  review_subject_id INTEGER NOT NULL,
  post_slug TEXT NOT NULL,
  post_url TEXT NOT NULL,
  post_date DATE NOT NULL,
  post_title TEXT NOT NULL,
  section_ordinal INTEGER NOT NULL,
  rating_raw TEXT,
  rating_numeric NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);

ALTER TABLE dojo.review_reference
  ADD COLUMN IF NOT EXISTS review_subject_id INTEGER,
  ADD COLUMN IF NOT EXISTS post_slug TEXT,
  ADD COLUMN IF NOT EXISTS post_url TEXT,
  ADD COLUMN IF NOT EXISTS post_date DATE,
  ADD COLUMN IF NOT EXISTS post_title TEXT,
  ADD COLUMN IF NOT EXISTS section_ordinal INTEGER,
  ADD COLUMN IF NOT EXISTS rating_raw TEXT,
  ADD COLUMN IF NOT EXISTS rating_numeric NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

UPDATE dojo.review_reference
SET
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  created_by = COALESCE(created_by, CURRENT_USER)
WHERE created_at IS NULL
   OR created_by IS NULL;

ALTER TABLE dojo.review_reference
  ALTER COLUMN review_subject_id SET NOT NULL,
  ALTER COLUMN post_slug SET NOT NULL,
  ALTER COLUMN post_url SET NOT NULL,
  ALTER COLUMN post_date SET NOT NULL,
  ALTER COLUMN post_title SET NOT NULL,
  ALTER COLUMN section_ordinal SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT CURRENT_USER,
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_reference_review_subject_id_fkey'
      AND conrelid = 'dojo.review_reference'::regclass
  ) THEN
    ALTER TABLE dojo.review_reference
    ADD CONSTRAINT review_reference_review_subject_id_fkey
    FOREIGN KEY (review_subject_id)
    REFERENCES dojo.review_subject(id)
    ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_reference_subject_slug_ordinal_key'
      AND conrelid = 'dojo.review_reference'::regclass
  ) THEN
    ALTER TABLE dojo.review_reference
    ADD CONSTRAINT review_reference_subject_slug_ordinal_key
    UNIQUE (review_subject_id, post_slug, section_ordinal);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_reference_section_ordinal_check'
      AND conrelid = 'dojo.review_reference'::regclass
  ) THEN
    ALTER TABLE dojo.review_reference
    ADD CONSTRAINT review_reference_section_ordinal_check
    CHECK (section_ordinal > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_reference_rating_numeric_check'
      AND conrelid = 'dojo.review_reference'::regclass
  ) THEN
    ALTER TABLE dojo.review_reference
    ADD CONSTRAINT review_reference_rating_numeric_check
    CHECK (rating_numeric IS NULL OR (rating_numeric >= 0 AND rating_numeric <= 10));
  END IF;
END
$$;

COMMENT ON TABLE dojo.review_reference IS
  'Normalized ReleaseSection review references keyed to post_slug plus section_ordinal; rendered narrative and MDX blocks remain in the content files.';

COMMENT ON COLUMN dojo.review_reference.review_subject_id IS
  'Foreign key to the parent normalized review subject.';

COMMENT ON COLUMN dojo.review_reference.post_slug IS
  'Chronicle MDX slug that contains the ReleaseSection review metadata.';

COMMENT ON COLUMN dojo.review_reference.post_url IS
  'Rendered chronicle route used to link back to the original MDX post.';

COMMENT ON COLUMN dojo.review_reference.post_date IS
  'Chronicle publish date associated with the ReleaseSection review metadata.';

COMMENT ON COLUMN dojo.review_reference.post_title IS
  'Chronicle post title used in review detail feeds.';

COMMENT ON COLUMN dojo.review_reference.section_ordinal IS
  '1-based ordinal of the review-bearing ReleaseSection within the chronicle post; used with post_slug to reconnect DB metadata to the original MDX section.';

COMMENT ON COLUMN dojo.review_reference.rating_raw IS
  'Original rating string copied from ReleaseSection review.rating.';

COMMENT ON COLUMN dojo.review_reference.rating_numeric IS
  'Numeric rating parsed from rating_raw when possible; null when the source string is missing or non-numeric.';

CREATE INDEX IF NOT EXISTS idx_review_type_sort_order
ON dojo.review_type(sort_order ASC, slug ASC);

CREATE INDEX IF NOT EXISTS idx_review_subject_review_type_id
ON dojo.review_subject(review_type_id, external_id);

CREATE INDEX IF NOT EXISTS idx_review_reference_subject_post_date_desc
ON dojo.review_reference(review_subject_id, post_date DESC, section_ordinal ASC);

CREATE INDEX IF NOT EXISTS idx_review_reference_post_slug_ordinal
ON dojo.review_reference(post_slug, section_ordinal);

DROP TRIGGER IF EXISTS trg_audit_review_type ON dojo.review_type;
CREATE TRIGGER trg_audit_review_type
BEFORE INSERT OR UPDATE ON dojo.review_type
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_review_subject ON dojo.review_subject;
CREATE TRIGGER trg_audit_review_subject
BEFORE INSERT OR UPDATE ON dojo.review_subject
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

DROP TRIGGER IF EXISTS trg_audit_review_reference ON dojo.review_reference;
CREATE TRIGGER trg_audit_review_reference
BEFORE INSERT OR UPDATE ON dojo.review_reference
FOR EACH ROW
EXECUTE FUNCTION dojo.audit_stamp_generic();

INSERT INTO dojo.review_type (
  slug,
  label,
  singular_label,
  collection_path,
  sort_order
)
VALUES
  ('lcs', 'Local Card Shops', 'Card Shop', '/cardattack/lcs', 10),
  ('table-schema', 'Table Schema', 'Table Schema', '/unclejimmy/table-schema', 20),
  ('save-point', 'Save Point', 'Save Point', '/unclejimmy/call-a-save-point', 30),
  ('golden-age', 'Golden Age', 'Antique Shop', '/unclejimmy/golden-age', 40)
ON CONFLICT (slug) DO UPDATE
SET
  label = EXCLUDED.label,
  singular_label = EXCLUDED.singular_label,
  collection_path = EXCLUDED.collection_path,
  sort_order = EXCLUDED.sort_order;

WITH review_reference_seed (
  review_type_slug,
  external_id,
  name,
  url,
  post_slug,
  post_url,
  post_date,
  post_title,
  section_ordinal,
  rating_raw
) AS (
  VALUES
    ('lcs', 'indy-card-exchange', 'Indy Card Exchange', 'https://indycardexchange.com/', 'indy-card-exchange', '/shaolin/indy-card-exchange', DATE '2026-02-14', 'indy card exchange', 1, '8.7/10'),
    ('lcs', 'iconic-sports-cards', 'Iconic Sports Cards', 'https://iconicbreaks.com/', 'usa-usa-usa', '/shaolin/usa-usa-usa', DATE '2026-02-22', 'USA! USA! USA!', 2, '8.5'),
    ('table-schema', '1', 'Colossal Cafe', 'https://colossalcafe.com/', 'usa-usa-usa', '/shaolin/usa-usa-usa', DATE '2026-02-22', 'USA! USA! USA!', 1, '7.7'),
    ('table-schema', '2', 'Draft Gastropub', 'https://www.draftappleton.com/', 'draft', '/shaolin/draft', DATE '2026-02-27', 'draft', 1, '7.4'),
    ('save-point', 'mewgenics', 'Mewgenics', 'https://mewgenics.wiki.gg/', 'call-a-save-point', '/shaolin/call-a-save-point', DATE '2026-03-03', 'call a save point', 1, '9.5'),
    ('golden-age', 'little-red-barn', 'Little Red Barn Antiques', NULL, 'self-care', '/shaolin/self-care', DATE '2026-04-01', 'self care', 1, '8.8/10')
),
review_subject_seed AS (
  SELECT DISTINCT
    review_type_slug,
    external_id,
    NULLIF(BTRIM(name), '') AS name,
    NULLIF(BTRIM(url), '') AS url
  FROM review_reference_seed
)
INSERT INTO dojo.review_subject (
  review_type_id,
  external_id,
  name,
  url
)
SELECT
  review_type.id,
  seed.external_id,
  seed.name,
  seed.url
FROM review_subject_seed AS seed
JOIN dojo.review_type AS review_type
  ON review_type.slug = seed.review_type_slug
ON CONFLICT (review_type_id, external_id) DO UPDATE
SET
  name = COALESCE(EXCLUDED.name, dojo.review_subject.name),
  url = COALESCE(EXCLUDED.url, dojo.review_subject.url);

WITH review_reference_seed (
  review_type_slug,
  external_id,
  name,
  url,
  post_slug,
  post_url,
  post_date,
  post_title,
  section_ordinal,
  rating_raw
) AS (
  VALUES
    ('lcs', 'indy-card-exchange', 'Indy Card Exchange', 'https://indycardexchange.com/', 'indy-card-exchange', '/shaolin/indy-card-exchange', DATE '2026-02-14', 'indy card exchange', 1, '8.7/10'),
    ('lcs', 'iconic-sports-cards', 'Iconic Sports Cards', 'https://iconicbreaks.com/', 'usa-usa-usa', '/shaolin/usa-usa-usa', DATE '2026-02-22', 'USA! USA! USA!', 2, '8.5'),
    ('table-schema', '1', 'Colossal Cafe', 'https://colossalcafe.com/', 'usa-usa-usa', '/shaolin/usa-usa-usa', DATE '2026-02-22', 'USA! USA! USA!', 1, '7.7'),
    ('table-schema', '2', 'Draft Gastropub', 'https://www.draftappleton.com/', 'draft', '/shaolin/draft', DATE '2026-02-27', 'draft', 1, '7.4'),
    ('save-point', 'mewgenics', 'Mewgenics', 'https://mewgenics.wiki.gg/', 'call-a-save-point', '/shaolin/call-a-save-point', DATE '2026-03-03', 'call a save point', 1, '9.5'),
    ('golden-age', 'little-red-barn', 'Little Red Barn Antiques', NULL, 'self-care', '/shaolin/self-care', DATE '2026-04-01', 'self care', 1, '8.8/10')
)
INSERT INTO dojo.review_reference (
  review_subject_id,
  post_slug,
  post_url,
  post_date,
  post_title,
  section_ordinal,
  rating_raw,
  rating_numeric
)
SELECT
  review_subject.id,
  seed.post_slug,
  seed.post_url,
  seed.post_date,
  seed.post_title,
  seed.section_ordinal,
  seed.rating_raw,
  CASE
    WHEN NULLIF(BTRIM(seed.rating_raw), '') IS NULL THEN NULL
    WHEN BTRIM(seed.rating_raw) ~ '^\d+(?:\.\d+)?(?:\s*/\s*\d+(?:\.\d+)?)?$'
      THEN substring(BTRIM(seed.rating_raw) FROM '^(\d+(?:\.\d+)?)')::numeric(4,2)
    ELSE NULL
  END AS rating_numeric
FROM review_reference_seed AS seed
JOIN dojo.review_type AS review_type
  ON review_type.slug = seed.review_type_slug
JOIN dojo.review_subject AS review_subject
  ON review_subject.review_type_id = review_type.id
 AND review_subject.external_id = seed.external_id
ON CONFLICT (review_subject_id, post_slug, section_ordinal) DO UPDATE
SET
  post_url = EXCLUDED.post_url,
  post_date = EXCLUDED.post_date,
  post_title = EXCLUDED.post_title,
  rating_raw = EXCLUDED.rating_raw,
  rating_numeric = EXCLUDED.rating_numeric;

COMMIT;
