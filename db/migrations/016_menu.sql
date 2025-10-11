-- 016_menu.sql ; dojo.menu (single require) + seed
-- Idempotent: safe to re-run

-- 1) Table
CREATE TABLE IF NOT EXISTS dojo.menu_node (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id    BIGINT NULL REFERENCES dojo.menu_node(id) ON DELETE CASCADE,
  persona      TEXT NOT NULL CHECK (persona IN ('mark2','tullyelly','cardattack','theabbott','unclejimmy')),
  kind         TEXT NOT NULL CHECK (kind IN ('persona','link','external','group')),
  label        TEXT NOT NULL,
  CONSTRAINT chk_persona_label_lower CHECK (kind <> 'persona' OR label = lower(label)),
  href         TEXT NULL,
  target       TEXT NULL CHECK (target IN ('_self','_blank')),
  icon         TEXT NULL,
  order_index  INT  NOT NULL DEFAULT 0,
  feature_key  TEXT NULL REFERENCES dojo.authz_feature(key) ON DELETE SET NULL,
  hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
  published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   TEXT DEFAULT CURRENT_USER,
  updated_at   TIMESTAMPTZ,
  updated_by   TEXT,
  CONSTRAINT chk_href_required CHECK (
    (kind IN ('link','external') AND href IS NOT NULL)
    OR (kind IN ('persona','group') AND href IS NULL)
  )
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_menu_parent      ON dojo.menu_node(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_persona_ord ON dojo.menu_node(persona, order_index);
CREATE INDEX IF NOT EXISTS idx_menu_feature     ON dojo.menu_node(feature_key);
CREATE INDEX IF NOT EXISTS idx_menu_published   ON dojo.menu_node(published);

-- 3) View: published tree
CREATE OR REPLACE VIEW dojo.v_menu_published AS
SELECT *
FROM dojo.menu_node
WHERE published
ORDER BY persona, COALESCE(parent_id, 0), order_index, id;

INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('menu','Menu', TRUE)
ON CONFLICT (slug) DO NOTHING;

WITH menu_app AS (
  SELECT id FROM dojo.authz_app WHERE slug = 'menu'
), feature_defs AS (
  SELECT * FROM (VALUES
    -- mark2
    ('menu.mark2.overview','Menu: mark2 Overview'),
    ('menu.mark2.personas.about','Menu: About the Personas'),
    ('menu.mark2.admin','Menu: Admin'),
    ('menu.mark2.system.health','Menu: System Health'),
    ('menu.mark2.scrolls','Menu: Shaolin Scrolls'),
    -- cardattack
    ('menu.cardattack.overview','Menu: cardattack Overview'),
    ('menu.cardattack.tcdb.home','Menu: TCDB Home'),
    ('menu.cardattack.tcdb.rankings','Menu: TCDB Rankings'),
    -- theabbott
    ('menu.theabbott.overview','Menu: theabbott Overview'),
    ('menu.theabbott.hhe','Menu: Heels Have Eyes'),
    ('menu.theabbott.roadwork','Menu: Roadwork Rappin'),
    -- unclejimmy
    ('menu.unclejimmy.overview','Menu: unclejimmy Overview'),
    ('menu.unclejimmy.cute','Menu: Cute Cards'),
    -- tullyelly
    ('menu.tullyelly.overview','Menu: tullyelly Overview'),
    ('menu.tullyelly.docs','Menu: Docs')
  ) AS t(feature_key, feature_description)
)
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT menu_app.id, feature_defs.feature_key, feature_defs.feature_description, TRUE
FROM menu_app
JOIN feature_defs ON TRUE
ON CONFLICT (key) DO UPDATE
  SET app_id = EXCLUDED.app_id,
      description = EXCLUDED.description,
      enabled = TRUE;

-- 5) Seed personas (top layer); insert if missing
WITH _u AS (
  INSERT INTO dojo.menu_node (parent_id, persona, kind, label, icon, order_index)
  VALUES
    (NULL, 'mark2',      'persona', 'mark2',      'Brain',  10),
    (NULL, 'cardattack', 'persona', 'cardattack', 'GalleryHorizontalEnd', 20),
    (NULL, 'theabbott',  'persona', 'theabbott',  'Feather', 30),
    (NULL, 'unclejimmy', 'persona', 'unclejimmy', 'Smile',   40),
    (NULL, 'tullyelly',  'persona', 'tullyelly',  'Code2',   50)
  ON CONFLICT DO NOTHING
  RETURNING id, persona
)
SELECT 1;

-- 6) Attach children if missing (Overview first, then other links)

-- mark2
INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'mark2','link','Overview','/mark2','menu.mark2.overview',0,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='mark2'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Overview');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'mark2','link','About the Personas','/mark2/about-personas','menu.mark2.personas.about',5,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='mark2'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='About the Personas');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'mark2','link','Admin','/admin','menu.mark2.admin',10
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='mark2'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Admin');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'mark2','link','System Health','/system/health','menu.mark2.system.health',20
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='mark2'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='System Health');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'mark2','link','Shaolin Scrolls','/mark2/shaolin-scrolls','menu.mark2.scrolls',30
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='mark2'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Shaolin Scrolls');

-- cardattack
INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'cardattack','link','Overview','/cardattack','menu.cardattack.overview',0,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='cardattack'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Overview');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'cardattack','link','TCDB Home','/tcdb','menu.cardattack.tcdb.home',10
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='cardattack'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='TCDB Home');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'cardattack','link','Rankings','/tcdb-rankings','menu.cardattack.tcdb.rankings',20
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='cardattack'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Rankings');

-- theabbott
INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'theabbott','link','Overview','/theabbott','menu.theabbott.overview',0,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='theabbott'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Overview');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'theabbott','link','heels have eyes','/theabbott/heels-have-eyes','menu.theabbott.hhe',10,
       '{"badge":{"text":"NEW","tone":"new"}}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='theabbott'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='heels have eyes');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'theabbott','link','roadwork rappin','/theabbott/roadwork-rappin','menu.theabbott.roadwork',20
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='theabbott'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='roadwork rappin');

-- unclejimmy
INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'unclejimmy','link','Overview','/unclejimmy','menu.unclejimmy.overview',0,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='unclejimmy'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Overview');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'unclejimmy','link','cute cards','/unclejimmy/cute-cards','menu.unclejimmy.cute',10
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='unclejimmy'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='cute cards');

-- tullyelly
INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT p.id, 'tullyelly','link','Overview','/tullyelly','menu.tullyelly.overview',0,'{}'::jsonb
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='tullyelly'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Overview');

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index)
SELECT p.id, 'tullyelly','link','Docs','/docs','menu.tullyelly.docs',10
FROM dojo.menu_node p
WHERE p.kind='persona' AND p.persona='tullyelly'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node c WHERE c.parent_id=p.id AND c.label='Docs');
