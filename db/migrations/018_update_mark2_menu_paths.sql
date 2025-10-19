-- 018_update_mark2_menu_paths.sql
-- Update mark2 menu entries to point at the new routes.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.menu_node
   SET href = '/mark2/admin'
 WHERE feature_key = 'menu.mark2.admin'
   AND href = '/admin';

UPDATE dojo.menu_node
   SET href = '/mark2/shaolin-scrolls'
 WHERE feature_key = 'menu.mark2.scrolls'
   AND href = '/shaolin-scrolls';

COMMIT;
