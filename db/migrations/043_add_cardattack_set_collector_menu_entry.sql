-- 043_add_cardattack_set_collector_menu_entry.sql
-- Add the Set Collector entry to the cardattack menu.

SET search_path = dojo, public;

BEGIN;

INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('menu', 'Menu', TRUE)
ON CONFLICT (slug) DO NOTHING;

WITH menu_app AS (
  SELECT id
    FROM dojo.authz_app
   WHERE slug = 'menu'
)
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT menu_app.id,
       'menu.cardattack.tcdb.set.collector',
       'Menu: Set Collector',
       TRUE
  FROM menu_app
ON CONFLICT (key) DO UPDATE
  SET app_id = EXCLUDED.app_id,
      description = EXCLUDED.description,
      enabled = TRUE;

UPDATE dojo.menu_node AS child
   SET parent_id = parent.id,
       persona = 'cardattack',
       kind = 'link',
       label = 'set collector',
       href = '/cardattack/set-collector',
       feature_key = NULL,
       order_index = 40,
       hidden = FALSE,
       published = TRUE,
       updated_at = now(),
       updated_by = CURRENT_USER
  FROM dojo.menu_node AS parent
 WHERE parent.kind = 'persona'
   AND parent.persona = 'cardattack'
   AND child.kind IN ('link', 'external')
   AND (
     child.feature_key = 'menu.cardattack.tcdb.set.collector'
     OR child.href = '/cardattack/set-collector'
   );

INSERT INTO dojo.menu_node (
  parent_id,
  persona,
  kind,
  label,
  href,
  feature_key,
  order_index,
  meta
)
SELECT parent.id,
       'cardattack',
       'link',
       'set collector',
       '/cardattack/set-collector',
       NULL,
       40,
       '{}'::jsonb
  FROM dojo.menu_node AS parent
 WHERE parent.kind = 'persona'
   AND parent.persona = 'cardattack'
   AND NOT EXISTS (
     SELECT 1
       FROM dojo.menu_node AS child
      WHERE child.feature_key = 'menu.cardattack.tcdb.set.collector'
         OR child.href = '/cardattack/set-collector'
   );

COMMIT;
