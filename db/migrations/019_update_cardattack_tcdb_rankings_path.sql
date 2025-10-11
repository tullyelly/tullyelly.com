-- 019_update_cardattack_tcdb_rankings_path.sql
-- Move TCDB rankings menu entry under the cardattack namespace.

SET search_path = dojo, public;

BEGIN;

UPDATE dojo.menu_node
   SET href = '/cardattack/tcdb-rankings'
 WHERE feature_key = 'menu.cardattack.tcdb.rankings'
   AND href = '/tcdb-rankings';

COMMIT;
