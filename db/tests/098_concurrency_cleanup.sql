-- JAMES ONLY, existing DEVELOPMENT after both consoles have ended their tests.
BEGIN;
DO $guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.homie WHERE id=-1261002 OR tag_slug='wu-1261-concurrency-fixture')
     OR EXISTS(SELECT 1 FROM dojo.tags WHERE slug='wu-1261-concurrency-fixture') THEN
    RAISE EXCEPTION 'unexpected committed athlete/tag fixture; stop and investigate';
  END IF;
END;
$guard$;
DELETE FROM dojo.unclejimmy_squad_item WHERE section_key='nuclear-reactor'
  AND slug='wu-1261-concurrency-fixture' AND label='WU-1261 concurrency fixture' AND kind='person';
COMMIT;
