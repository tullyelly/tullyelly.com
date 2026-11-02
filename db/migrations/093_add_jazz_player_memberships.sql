-- 093_add_jazz_player_memberships.sql
-- Production and existing development inspected read-only on 2026-11-01.
-- Twelve reviewed Jazz playing-career memberships; current homie aliases.
-- Existing identity tags are required. No identity is created, renamed or deleted.
-- James executes the complete file in development, then approved production.
-- After failure, ROLLBACK in that session before rerunning the complete file.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE jazz_membership_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  affiliation_scope TEXT NOT NULL CHECK (affiliation_scope = 'professional'),
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

INSERT INTO jazz_membership_seed (homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) VALUES
  ('Armen Gilliam', 'armen-gilliam', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'),
  ('Blue Edwards', 'blue', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'),
  ('Danny Manning', 'danny', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'),
  ('Dell Curry', 'dell', 'jazz', 'professional', 'https://jr.nba.com/so-who-is-stephen-currys-dad/'),
  ('Eric Murdock', 'murdock', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf'),
  ('Ersan İlyasova', 'charge', 'jazz', 'professional', 'https://www.nba.com/jazz/history/player?pid=101141'),
  ('George Hill', 'blm', 'jazz', 'professional', 'https://www.nba.com/jazz/news/george-hill-named-nbas-western-conference-player-week'),
  ('Grayson Allen', 'grayson', 'jazz', 'professional', 'https://www.nba.com/news/anthony-edwards-42-points-make-mark-in-nba-rookie-history'),
  ('Joe Ingles', 'ingles', 'jazz', 'professional', 'https://www.nba.com/news/joe-ingles-returns-to-australias-national-basketball-league'),
  ('John Stockton', 'john-stockton', 'jazz', 'professional', 'https://www.nba.com/player/304'),
  ('Karl Malone', 'karl-malone', 'jazz', 'professional', 'https://www.nba.com/jazz/history/player?pid=252'),
  ('Wes Matthews', 'wes', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf');

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
SELECT string_agg(expected.source_slug || ' -> ' || expected.clan_slug, E'\n'
  ORDER BY expected.source_slug, expected.clan_slug) INTO endpoint_problems
FROM jazz_membership_seed AS expected
LEFT JOIN dojo.homie AS homie
  ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
  OR source_tag.id = target_tag.id
  OR (SELECT count(*) FROM dojo.homie AS candidate
      WHERE candidate.tag_slug = expected.source_slug) <> 1
  OR (clan.slug = 'jazz' AND clan.name IS DISTINCT FROM 'Utah Jazz')
  OR source_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'person'
  OR source_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
  OR target_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
  OR target_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan' ;
  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION '093 reviewed identities missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems;
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', seed.affiliation_scope,
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-11-01',
  'migration', '093_add_jazz_player_memberships'
)
FROM jazz_membership_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM jazz_membership_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION '093 expected membership missing; transaction aborted';
  END IF;
END;
$check$;
COMMIT;
