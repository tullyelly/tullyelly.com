-- 091_complete_homie_clan_memberships.sql
-- Production compared read-only on 2026-11-01. Manual execution only.
-- Requires existing tag identities and migrations through 089; no identities are renamed.
-- Run development first, then approved production. After failure, ROLLBACK
-- in that session before rerunning this complete transaction.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE homie_career_membership_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

INSERT INTO homie_career_membership_seed
  (homie_name, source_slug, clan_slug, evidence_url) VALUES
  ('Allen Iverson', 'allen-iverson', 'vancouver', 'https://s3.grizzliesapp.com/assets/media_guides/25-26/MG_25-26_MediaGuide.pdf'),
  ('Blue Edwards', 'blue', 'vancouver', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Grizzlies.pdf'),
  ('Eric Murdock', 'murdock', 'vancouver', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Grizzlies.pdf'),
  ('Grayson Allen', 'grayson', 'vancouver', 'https://www.nba.com/grizzlies/news/postgame/uta-200805'),
  ('Ja Morant', 'ja-morant', 'vancouver', 'https://s3.grizzliesapp.com/assets/media_guides/25-26/MG_25-26_MediaGuide.pdf'),
  ('Lee Mayberry', 'mayberry', 'vancouver', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Grizzlies.pdf'),
  ('Pau Gasol', 'pau', 'vancouver', 'https://s3.grizzliesapp.com/assets/media_guides/25-26/MG_25-26_MediaGuide.pdf'),
  ('Sam Merrill', 'sam', 'vancouver', 'https://api-hub.nba.com/player/1630241/sam-merrill/bio'),
  ('Vince Carter', 'vince-carter', 'vancouver', 'https://www.nba.com/kings/news/kings-sign-vince-carter'),
  ('AJ Johnson', 'aj', 'bucks-n-six', 'https://www.nba.com/wizards/news/wizards-acquire-middleton-johnson-from-milwaukee-bucks'),
  ('Cole Anthony', 'cole', 'bucks-n-six', 'https://statsdmz.nba.com/pdfs/20251024/20251024_MILTOR_book.pdf'),
  ('Lindsey Hunter', 'lindsey', 'bucks-n-six', 'https://www.nba.com/game/nyk-vs-mil-0020000592/box-score'),
  ('Lindsey Hunter', 'lindsey', 'purple-and-gold', 'https://www.nba.com/lakers/history/season-capsule'),
  ('Bronny James Jr.', 'bronny', 'purple-and-gold', 'https://cdn-uat.nba.com/news/bronny-james-plenty-to-learn-after-return-to-lakers'),
  ('Julius Randle', 'orange-julius', 'purple-and-gold', 'https://www.nba.com/player/203944/julius-randle/bio'),
  ('Julius Randle', 'orange-julius', 't-wolves', 'https://cdn.nba.com/teams/uploads/sites/1610612750/2025/10/10.29-LAL-Postgame-Notes.pdf'),
  ('Tyler Herro', 'herro', 'heat-culture', 'https://www.nba.com/news/tyler-herro-return-2025-26-season-debut'),
  ('Tyler Herro', 'herro', 'bucks-n-six', 'https://www.nba.com/bucks/game/0022600138-rockets-vs-bucks-milwaukee-wi-10-28-2026/event-details');

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
  SELECT string_agg(seed.source_slug || ' -> ' || seed.clan_slug, E'\n'
    ORDER BY seed.source_slug, seed.clan_slug) INTO endpoint_problems
  FROM homie_career_membership_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
  LEFT JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
  LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
  WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
    OR source_tag.id = target_tag.id
    OR (SELECT count(*) FROM dojo.homie AS candidate
        WHERE candidate.tag_slug = seed.source_slug) <> 1
    OR source_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'person'
    OR source_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
    OR target_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
    OR target_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan';

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'reviewed membership endpoints or evidence missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review identities and prerequisites, then ROLLBACK and rerun the complete file.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'migration', '091_complete_homie_clan_memberships',
  'reviewed_on', '2026-11-01',
  'affiliation_scope', 'professional',
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url
)
FROM homie_career_membership_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM homie_career_membership_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id
      AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
