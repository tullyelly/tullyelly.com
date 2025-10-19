-- 020_update_theabbott_hhe_path.sql
-- Move Heels Have Eyes menu entry under the theabbott namespace.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.menu_node
   SET href = '/theabbott/heels-have-eyes'
 WHERE feature_key = 'menu.theabbott.hhe'
   AND href = '/heels-have-eyes';

COMMIT;
