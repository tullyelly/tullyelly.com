-- Read-only assertions after manually applying migration 080.
BEGIN READ ONLY;

DO $test$
DECLARE
  expected RECORD;
BEGIN
  -- Representative new identities and cross-sport/career relationships.
  FOR expected IN
    SELECT * FROM (VALUES
      ('Aaron Rodgers', 'aaron-rodgers'),
      ('Bob Sura', 'bob-sura'),
      ('Dell Curry', 'dell'),
      ('Tobias Harris', 'tobias'),
      ('Nolan Ryan', 'nolan-ryan'),
      ('Joe Pavelski', 'joe-pavelski')
    ) AS seed(homie_name, tag_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.homie AS homie
      JOIN dojo.tags AS tag ON tag.slug = homie.tag_slug
      WHERE homie.name = expected.homie_name AND tag.slug = expected.tag_slug
        AND tag.href = '/cardattack/homies/' || expected.tag_slug
        AND tag.meta #>> '{identity,kind}' = 'person'
    ) THEN
      RAISE EXCEPTION 'expected player identity missing for %', expected.homie_name;
    END IF;
  END LOOP;

  FOR expected IN
    SELECT * FROM (VALUES
      ('freak', 'bucks-n-six'), ('freak', 'heat-culture'),
      ('lamelo', 't-wolves'), ('ant-man', 't-wolves'),
      ('barnes', 'noles'), ('fin-dawg', 'bucky'),
      ('aaron-rodgers', 'lombardi'), ('nolan-ryan', 'astros'),
      ('bucks-in-six', 'bucks-n-six'), ('bob-sura', 'rockets'), ('bob-sura', 'noles'),
      ('dell', 'bucks-n-six'), ('tobias', 'bucks-n-six'),
      ('dame-time', 'blazers'), ('nash', 'suns'),
      ('jagr', 'capitals'), ('t-brandon', 'ducks'), ('warrick', 'noles')
    ) AS seed(source_slug, clan_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source_tag ON source_tag.id = relation.source_tag_id
      JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
      WHERE source_tag.slug = expected.source_slug AND target_tag.slug = expected.clan_slug
        AND relation.relation_type = 'member_of'
    ) THEN
      RAISE EXCEPTION 'expected membership missing: % -> %', expected.source_slug, expected.clan_slug;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM dojo.clan AS clan
      JOIN dojo.tags AS tag ON tag.slug = clan.slug
      WHERE clan.slug IN ('blazers', 'suns')) <> 2 THEN
    RAISE EXCEPTION 'reviewed Portland/Phoenix reference clans or tags are missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM dojo.tag_relation
    WHERE meta->>'migration' = '080_populate_player_clan_memberships'
      AND (COALESCE(meta->>'affiliation_scope', '') NOT IN ('college', 'professional')
        OR NULLIF(meta->>'evidence_url', '') IS NULL
        OR meta->>'membership_basis' IS DISTINCT FROM 'played_for')
  ) THEN
    RAISE EXCEPTION 'new membership evidence metadata is incomplete';
  END IF;
END;
$test$;

ROLLBACK;
