-- 071_add_identity_experience_routes.sql
-- Add canonical identity experiences and reconcile their menu entries.

SET search_path = dojo, auth, public;

BEGIN;

INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('menu', 'Menu', TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_public = TRUE;

WITH feature_defs(feature_key, description) AS (
  VALUES
    ('menu.cardattack.homies', 'Menu: cardattack Homies'),
    ('menu.cardattack.clans', 'Menu: cardattack Clans'),
    ('menu.theabbott.crates', 'Menu: The Crates'),
    ('menu.theabbott.homies', 'Menu: theabbott Homies'),
    ('menu.theabbott.clans', 'Menu: theabbott Clans'),
    ('menu.unclejimmy.fam', 'Menu: unclejimmy Fam'),
    ('menu.unclejimmy.squads', 'Menu: unclejimmy Squads')
)
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT app.id, feature_defs.feature_key, feature_defs.description, TRUE
FROM dojo.authz_app AS app
CROSS JOIN feature_defs
WHERE app.slug = 'menu'
ON CONFLICT (key) DO UPDATE
SET app_id = EXCLUDED.app_id,
    description = EXCLUDED.description,
    enabled = TRUE;

DO $$
DECLARE
  entry RECORD;
  v_parent_id BIGINT;
  v_canonical_id BIGINT;
BEGIN
  FOR entry IN
    SELECT * FROM (VALUES
      ('cardattack', 'Homies', '/cardattack/homies', 'menu.cardattack.homies', 20),
      ('cardattack', 'Clans', '/cardattack/clans', 'menu.cardattack.clans', 25),
      ('theabbott', 'The Crates', '/theabbott/crates', 'menu.theabbott.crates', 10),
      ('theabbott', 'Homies', '/theabbott/homies', 'menu.theabbott.homies', 20),
      ('theabbott', 'Clans', '/theabbott/clans', 'menu.theabbott.clans', 30),
      ('unclejimmy', 'Fam', '/unclejimmy/fam', 'menu.unclejimmy.fam', 10),
      ('unclejimmy', 'Squads', '/unclejimmy/squads', 'menu.unclejimmy.squads', 20)
    ) AS definitions(persona, label, href, feature_key, order_index)
  LOOP
    SELECT id INTO v_parent_id
    FROM dojo.menu_node
    WHERE kind = 'persona'
      AND persona = entry.persona
      AND parent_id IS NULL
    ORDER BY id
    LIMIT 1;

    IF v_parent_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT id INTO v_canonical_id
    FROM dojo.menu_node
    WHERE feature_key = entry.feature_key OR href = entry.href
    ORDER BY CASE WHEN feature_key = entry.feature_key THEN 0 ELSE 1 END, id
    LIMIT 1;

    IF v_canonical_id IS NULL THEN
      INSERT INTO dojo.menu_node (
        parent_id, persona, kind, label, href, feature_key, order_index, meta
      ) VALUES (
        v_parent_id, entry.persona, 'link', entry.label, entry.href,
        entry.feature_key, entry.order_index, '{}'::jsonb
      ) RETURNING id INTO v_canonical_id;
    ELSE
      UPDATE dojo.menu_node
      SET parent_id = v_parent_id,
          persona = entry.persona,
          kind = 'link',
          label = entry.label,
          href = entry.href,
          feature_key = entry.feature_key,
          order_index = entry.order_index,
          hidden = FALSE,
          published = TRUE,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = CURRENT_USER
      WHERE id = v_canonical_id;
    END IF;

    UPDATE dojo.menu_node
    SET hidden = TRUE,
        published = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = CURRENT_USER
    WHERE id <> v_canonical_id
      AND (feature_key = entry.feature_key OR href = entry.href);
  END LOOP;
END
$$;

UPDATE dojo.menu_node
SET order_index = 40
WHERE persona = 'theabbott' AND href = '/theabbott/heels-have-eyes';
UPDATE dojo.menu_node
SET order_index = 50
WHERE persona = 'theabbott' AND href = '/theabbott/roadwork-rappin';
UPDATE dojo.menu_node
SET order_index = 30
WHERE persona = 'unclejimmy' AND feature_key = 'menu.unclejimmy.cute';

-- Person/team rows provide the conservative classification used here. Keep
-- all unrelated tag metadata while changing canonical Uncle Jimmy routes.
UPDATE dojo.tags AS tag
SET href = CASE item.kind
      WHEN 'person' THEN '/unclejimmy/fam/' || tag.slug
      ELSE '/unclejimmy/squads/' || tag.slug
    END,
    meta = tag.meta || jsonb_build_object(
      'identity',
      COALESCE(tag.meta->'identity', '{}'::jsonb)
        || jsonb_build_object(
          'contexts',
          COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)
            || jsonb_build_object(
              'unclejimmy',
              COALESCE(tag.meta->'identity'->'contexts'->'unclejimmy', '{}'::jsonb)
                || jsonb_build_object(
                  'role', CASE item.kind WHEN 'person' THEN 'fam' ELSE 'squad' END,
                  'href', CASE item.kind
                    WHEN 'person' THEN '/unclejimmy/fam/' || tag.slug
                    ELSE '/unclejimmy/squads/' || tag.slug
                  END
                )
            )
        )
    )
FROM dojo.unclejimmy_squad_item AS item
WHERE item.slug = tag.slug
  AND item.kind IN ('person', 'team');

COMMIT;
