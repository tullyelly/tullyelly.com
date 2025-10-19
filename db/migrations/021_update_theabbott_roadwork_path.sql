-- 021_update_theabbott_roadwork_path.sql
-- Move Roadwork Rappin menu entry under the theabbott namespace.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.menu_node
   SET href = '/theabbott/roadwork-rappin'
 WHERE feature_key = 'menu.theabbott.roadwork'
   AND href = '/roadwork-rappin';

COMMIT;
