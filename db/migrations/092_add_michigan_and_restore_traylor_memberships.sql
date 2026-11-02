-- 092_add_michigan_and_restore_traylor_memberships.sql
-- Production and existing development inspected read-only on 2026-11-01.
-- Seven Michigan playing memberships and one current-alias Bucks repair.
-- Existing identity tags are required. No identity is created, renamed or deleted.
-- James executes the complete file in development, then approved production.
-- After failure, ROLLBACK in that session before rerunning the complete file.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE michigan_membership_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  affiliation_scope TEXT NOT NULL CHECK (affiliation_scope IN ('college', 'professional')),
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

INSERT INTO michigan_membership_seed (homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) VALUES
  ('Charles Woodson', 'charles-woodson', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history'),
  ('Chris Webber', 'timeout', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('D.J. Wilson', 'dj', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/wolverines-in-professional-basketball'),
  ('Desmond Howard', 'desmond-howard', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history'),
  ('Jalen Rose', 'jalen-rose', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('Juwan Howard', 'juwan', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('Tractor Traylor', 'tractor', 'fab-five', 'college', 'https://mgoblue.com/documents/download/2021/11/5/bkm_honors_awards.pdf'),
  ('Tractor Traylor', 'tractor', 'bucks-n-six', 'professional', 'https://www.nba.com/game/mil-vs-bos-0029800446/box-score');

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
SELECT string_agg(expected.source_slug || ' -> ' || expected.clan_slug, E'\n'
  ORDER BY expected.source_slug, expected.clan_slug) INTO endpoint_problems
FROM michigan_membership_seed AS expected
LEFT JOIN dojo.homie AS homie
  ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
  OR source_tag.id = target_tag.id
  OR (SELECT count(*) FROM dojo.homie AS candidate
      WHERE candidate.tag_slug = expected.source_slug) <> 1
  OR (clan.slug = 'fab-five' AND clan.name IS DISTINCT FROM 'Michigan Wolverines')
  OR source_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'person'
  OR source_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
  OR target_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
  OR target_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan' ;
  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION '092 reviewed identities missing or changed; transaction aborted'
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
  'migration', '092_add_michigan_and_restore_traylor_memberships'
)
FROM michigan_membership_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM michigan_membership_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION '092 expected membership missing; transaction aborted';
  END IF;
END;
$check$;
COMMIT;
