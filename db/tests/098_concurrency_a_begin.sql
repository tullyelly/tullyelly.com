-- JAMES ONLY, existing DEVELOPMENT console A. Leave transaction open.
-- First verify this fixture slug/id is unused. Run B in a second existing console,
-- then run 098_concurrency_a_commit.sql in THIS same console to release the lock.
BEGIN;
SET LOCAL statement_timeout='60s';
DO $guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.homie WHERE id=-1261002 OR tag_slug='wu-1261-concurrency-fixture')
    OR EXISTS(SELECT 1 FROM dojo.tags WHERE slug='wu-1261-concurrency-fixture')
    OR EXISTS(SELECT 1 FROM dojo.unclejimmy_squad_item WHERE slug='wu-1261-concurrency-fixture') THEN
    RAISE EXCEPTION 'fixture namespace occupied; stop';
  END IF;
END;
$guard$;
INSERT INTO dojo.unclejimmy_squad_item(section_key,slug,label,kind)
VALUES('nuclear-reactor','wu-1261-concurrency-fixture','WU-1261 concurrency fixture','person');
