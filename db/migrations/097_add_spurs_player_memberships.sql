-- 097_add_spurs_player_memberships.sql
-- Production and existing development inspected read-only on 2026-11-08.
-- Twenty-one reviewed Spurs playing-career memberships; current homie aliases.
-- Existing identity tags are required. No identity is created, renamed or deleted.
-- James executes the complete file in development, then approved production.
-- After failure, ROLLBACK in that session before rerunning the complete file.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE spurs_membership_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  affiliation_scope TEXT NOT NULL CHECK (affiliation_scope = 'professional'),
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

INSERT INTO spurs_membership_seed (homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) VALUES
  ('Alvin Robertson', 'alvin-robertson', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Bryn Forbes', 'bryn-forbes', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Charlie Ward', 'charlie-ward', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Chris Paul', 'cp3', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dale Ellis', 'dale-ellis', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('David Robinson', 'the-admiral', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dennis Rodman', 'the-worm', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Devin Vassell', 'devin', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dominique Wilkins', 'dominique-wilkins', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dāvis Bertāns', 'davis-bertans', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('George Hill', 'blm', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Glenn Robinson', 'big-dog', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Kawhi Leonard', 'kwhhyyy', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Michael Finley', 'fin-dawg', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Moses Malone', 'moses', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Pau Gasol', 'pau', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Sandro Mamukelashvili', 'mamu', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('T.J. Ford', 't-j-ford', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Tim Duncan', 'timmy', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Tracy McGrady', 't-mac', 'the-monastery', 'professional', 'https://www.si.com/nba/2013/08/26/tracy-mcgrady-retire-nba'),
  ('Victor Wembanyama', 'wemby', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster');

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
SELECT string_agg(expected.source_slug || ' -> ' || expected.clan_slug, E'\n'
  ORDER BY expected.source_slug, expected.clan_slug) INTO endpoint_problems
FROM spurs_membership_seed AS expected
LEFT JOIN dojo.homie AS homie
  ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
  OR source_tag.id = target_tag.id
  OR (SELECT count(*) FROM dojo.homie AS candidate
      WHERE candidate.tag_slug = expected.source_slug) <> 1
  OR (clan.slug = 'the-monastery' AND clan.name IS DISTINCT FROM 'San Antonio Spurs')
  OR source_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'person'
  OR source_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
  OR target_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
  OR target_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan' ;
  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION '097 reviewed identities missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems;
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', seed.affiliation_scope,
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-11-08',
  'migration', '097_add_spurs_player_memberships'
)
FROM spurs_membership_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM spurs_membership_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION '097 expected membership missing; transaction aborted';
  END IF;
END;
$check$;
COMMIT;

