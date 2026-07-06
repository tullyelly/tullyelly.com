-- 058_update_cardattack_homies_menu_path.sql
-- Move the Cardattack TCDB rankings menu entry to the Homies route.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.authz_feature
   SET description = 'Menu: Homies'
 WHERE key = 'menu.cardattack.tcdb.rankings';

UPDATE dojo.menu_node
   SET label = 'Homies',
       href = '/cardattack/homies'
 WHERE feature_key = 'menu.cardattack.tcdb.rankings';

COMMIT;
