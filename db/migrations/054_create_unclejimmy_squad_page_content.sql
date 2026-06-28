-- 054_create_unclejimmy_squad_page_content.sql
-- DB-backed content model for the unclejimmy squad landing page.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.unclejimmy_squad_section (
  section_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT unclejimmy_squad_section_key_check
    CHECK (btrim(section_key) <> ''),
  CONSTRAINT unclejimmy_squad_section_title_check
    CHECK (btrim(title) <> '')
);

COMMENT ON TABLE dojo.unclejimmy_squad_section IS
  'Published section metadata for the unclejimmy squad landing page.';

COMMENT ON COLUMN dojo.unclejimmy_squad_section.section_key IS
  'Stable application key used by the Next.js squad page renderer.';

CREATE TABLE IF NOT EXISTS dojo.unclejimmy_squad_item (
  id SERIAL PRIMARY KEY,
  section_key TEXT NOT NULL,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  blurb TEXT,
  href TEXT,
  kind TEXT NOT NULL DEFAULT 'link',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT unclejimmy_squad_item_section_key_fkey
    FOREIGN KEY (section_key)
    REFERENCES dojo.unclejimmy_squad_section(section_key)
    ON DELETE CASCADE,
  CONSTRAINT unclejimmy_squad_item_section_slug_key
    UNIQUE (section_key, slug),
  CONSTRAINT unclejimmy_squad_item_slug_check
    CHECK (btrim(slug) <> ''),
  CONSTRAINT unclejimmy_squad_item_label_check
    CHECK (btrim(label) <> ''),
  CONSTRAINT unclejimmy_squad_item_href_check
    CHECK (href IS NULL OR btrim(href) <> ''),
  CONSTRAINT unclejimmy_squad_item_kind_check
    CHECK (kind IN ('person', 'team', 'link', 'placeholder')),
  CONSTRAINT unclejimmy_squad_item_meta_object_check
    CHECK (jsonb_typeof(meta) = 'object')
);

COMMENT ON TABLE dojo.unclejimmy_squad_item IS
  'Published list items grouped under unclejimmy squad landing page sections.';

COMMENT ON COLUMN dojo.unclejimmy_squad_item.href IS
  'Optional explicit link. Person and team items without an href fall back to the squad member route.';

COMMENT ON COLUMN dojo.unclejimmy_squad_item.meta IS
  'Optional JSON payload for future display metadata without another schema change.';

CREATE INDEX IF NOT EXISTS unclejimmy_squad_section_published_order_idx
  ON dojo.unclejimmy_squad_section (is_published, display_order, section_key);

CREATE INDEX IF NOT EXISTS unclejimmy_squad_item_published_order_idx
  ON dojo.unclejimmy_squad_item (
    section_key,
    is_published,
    display_order,
    slug
  );

INSERT INTO dojo.unclejimmy_squad_section (
  section_key,
  title,
  description,
  display_order
)
VALUES
  (
    'nuclear-reactor',
    'nuclear reactor',
    'Primary sources of energy:',
    10
  ),
  (
    'trackers',
    'trackers',
    'Follow active logs and summaries:',
    20
  ),
  (
    'coming-soon',
    'coming soon....',
    NULL,
    30
  )
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO dojo.unclejimmy_squad_item (
  section_key,
  slug,
  label,
  blurb,
  href,
  kind,
  display_order
)
VALUES
  (
    'nuclear-reactor',
    'nikkigirl',
    'nikkigirl',
    'Placeholder blurb for nikkigirl inside the unclejimmy squad.',
    '/shaolin/tags/nikkigirl',
    'person',
    10
  ),
  (
    'nuclear-reactor',
    'bonnibel',
    'bonnibel',
    'Placeholder blurb for bonnibel; more details coming soon.',
    NULL,
    'person',
    20
  ),
  (
    'nuclear-reactor',
    'lulu',
    'lulu',
    'Placeholder blurb for lulu as part of the core squad energy.',
    '/shaolin/tags/lulu',
    'person',
    30
  ),
  (
    'nuclear-reactor',
    'jeff-meff',
    'jeff-meff',
    'Placeholder blurb for jeff-meff; tales will land here later.',
    NULL,
    'person',
    40
  ),
  (
    'nuclear-reactor',
    'eeeeeeeemma',
    'eeeeeeeemma',
    'Placeholder blurb for eeeeeeeemma with updates to follow.',
    '/shaolin/tags/eeeeeeeemma',
    'person',
    50
  ),
  (
    'trackers',
    'table-schema',
    'Table Schema',
    'Track the table schema log.',
    '/unclejimmy/table-schema',
    'link',
    10
  ),
  (
    'trackers',
    'volleyball-tournaments',
    'Volleyball Tournaments',
    'Track volleyball tournament summaries.',
    '/unclejimmy/squad/volleyball',
    'link',
    20
  ),
  (
    'coming-soon',
    'g-league',
    'g-league',
    NULL,
    NULL,
    'placeholder',
    10
  ),
  (
    'coming-soon',
    'bench-mob',
    'bench mob',
    NULL,
    NULL,
    'placeholder',
    20
  ),
  (
    'coming-soon',
    'key-personnel',
    'key personnel',
    NULL,
    NULL,
    'placeholder',
    30
  )
ON CONFLICT (section_key, slug) DO NOTHING;

CREATE OR REPLACE VIEW dojo.v_unclejimmy_squad_page_content AS
SELECT
  s.section_key,
  s.title AS section_title,
  s.description AS section_description,
  s.display_order AS section_display_order,
  i.slug AS item_slug,
  i.label AS item_label,
  i.blurb AS item_blurb,
  i.href AS item_href,
  i.kind AS item_kind,
  i.display_order AS item_display_order,
  i.meta AS item_meta
FROM dojo.unclejimmy_squad_section s
LEFT JOIN dojo.unclejimmy_squad_item i
  ON i.section_key = s.section_key
 AND i.is_published = TRUE
WHERE s.is_published = TRUE
ORDER BY
  s.display_order,
  s.section_key,
  i.display_order NULLS LAST,
  i.slug;

COMMENT ON VIEW dojo.v_unclejimmy_squad_page_content IS
  'Published unclejimmy squad landing page sections and items in display order.';

COMMIT;
