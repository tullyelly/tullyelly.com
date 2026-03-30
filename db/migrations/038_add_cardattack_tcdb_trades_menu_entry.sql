-- 038_add_cardattack_tcdb_trades_menu_entry.sql
-- Add the TCDB trades entry to the cardattack menu.

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
       'menu.cardattack.tcdb.trades',
       'Menu: TCDB Trades',
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
       label = 'tcdb trades',
       href = '/cardattack/tcdb-trades',
       order_index = 30,
       hidden = FALSE,
       published = TRUE,
       updated_at = now(),
       updated_by = CURRENT_USER
  FROM dojo.menu_node AS parent
 WHERE parent.kind = 'persona'
   AND parent.persona = 'cardattack'
   AND child.kind IN ('link', 'external')
   AND (
     child.feature_key = 'menu.cardattack.tcdb.trades'
     OR child.href = '/cardattack/tcdb-trades'
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
       'tcdb trades',
       '/cardattack/tcdb-trades',
       'menu.cardattack.tcdb.trades',
       30,
       '{}'::jsonb
  FROM dojo.menu_node AS parent
 WHERE parent.kind = 'persona'
   AND parent.persona = 'cardattack'
   AND NOT EXISTS (
     SELECT 1
       FROM dojo.menu_node AS child
      WHERE child.feature_key = 'menu.cardattack.tcdb.trades'
         OR child.href = '/cardattack/tcdb-trades'
   );

COMMIT;
