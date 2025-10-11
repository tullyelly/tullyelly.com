-- 018_update_mark2_admin_path.sql
-- Update mark2 admin menu entries to point at the new route.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.menu_node
   SET href = '/mark2/admin'
 WHERE feature_key = 'menu.mark2.admin'
   AND href = '/admin';

COMMIT;
