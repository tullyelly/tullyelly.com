-- 082_add_celtics_player_memberships.sql
-- Reviewed against production and refreshed development on 2026-10-24.
-- Manual execution only; requires the existing homie and clan tag identities.
-- These are verified playing-career affiliations, not a current-roster feed.
-- After a failed attempt, ROLLBACK before rerunning the complete file.
SET search_path = dojo, auth, public;

BEGIN;

LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;

CREATE TEMP TABLE celtics_player_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT PRIMARY KEY,
  evidence_url TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO celtics_player_seed (homie_name, source_slug, evidence_url) VALUES
  ('Blue Edwards', 'blue', 'https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KBOSCMG-2014.pdf#page=100'),
  ('Dominique Wilkins', 'dominique-wilkins', 'https://www.nba.com/team/1610612738/roster'),
  ('Gary Payton', 'the-glove', 'https://www.nba.com/team/1610612738/roster'),
  ('Jabari Parker', 'jabari', 'https://www.nba.com/celtics/news/sidebar/post-041921-shorthanded-celtics-edged-bulls-win-streak-ends-six'),
  ('Jason Terry', 'jason-terry', 'https://www.nba.com/kings/news/jason-terry-spend-remainder-season-rehabilitating-left-knee'),
  ('Jayson Tatum', 'big-deuce', 'https://www.nba.com/team/1610612738/roster'),
  ('Jeff Teague', 'jeff', 'https://www.nba.com/bucks/news/milwaukee-bucks-sign-jeff-teague'),
  ('Jrue Holiday', 'jrue', 'https://www.nba.com/blazers/news/trail-blazers-acquire-two-time-all-star-jrue-holiday'),
  ('Justin Jackson', 'justin-jackson', 'https://texas.gleague.nba.com/news/justin-jackson-returns-to-legends'),
  ('Kevin Garnett', 'the-big-ticket', 'https://www.nba.com/team/1610612738/roster'),
  ('Larry Bird', 'larry-bird', 'https://www.nba.com/team/1610612738/roster'),
  ('Malcolm Brogdon', 'malcolm-brogdon', 'https://www.nba.com/blazers/news/trail-blazers-acquire-malcolm-brogdon-and-robert-williams-iii'),
  ('Marty Conlon', 'marty-conlon', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Michael Finley', 'fin-dawg', 'https://www.nba.com/raptors/news/recap_040710.html'),
  ('Ray Allen', 'jesus', 'https://www.nba.com/team/1610612738/roster'),
  ('Robert Parish', 'robert-parish', 'https://www.nba.com/team/1610612738/roster'),
  ('Sam Cassell', 'alien', 'https://www.nba.com/sixers/news/rivers-assembles-impressive-staff'),
  ('Shaquille O''Neal', 'diesel', 'https://www.nba.com/team/1610612738/roster'),
  ('Sherman Douglas', 'sherminator', 'https://www.nba.com/magic/news/cohen_influentialplayers_031611.html'),
  ('Tiny Archibald', 'tiny-archibald', 'https://www.nba.com/team/1610612738/roster'),
  ('Todd Day', 'day', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Vin Baker', 'vin', 'https://www.nba.com/news/nba-birthdays-players-born-on-nov-23');

DO $check$
DECLARE
  celtics_tag_id INTEGER;
  endpoint_problems TEXT;
BEGIN
  SELECT tag.id INTO celtics_tag_id
  FROM dojo.clan AS clan
  JOIN dojo.tags AS tag ON tag.slug = clan.slug
  WHERE clan.slug = 'green-beer';

  IF celtics_tag_id IS NULL THEN
    RAISE EXCEPTION 'Celtics clan or canonical tag is missing: green-beer'
      USING HINT = 'Check the intended database and Celtics clan/tag, then ROLLBACK and rerun the complete migration.';
  END IF;

  SELECT string_agg(
    format('%s [%s -> green-beer]: %s', seed.homie_name, seed.source_slug,
      concat_ws(', ',
        CASE WHEN homie.id IS NULL THEN 'homie name/tag assignment missing or changed' END,
        CASE WHEN tag.id IS NULL THEN 'player tag missing' END,
        CASE WHEN tag.id = celtics_tag_id THEN 'player and Celtics share one tag' END
      )), E'\n' ORDER BY seed.homie_name
  ) INTO endpoint_problems
  FROM celtics_player_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS tag ON tag.slug = seed.source_slug
  WHERE homie.id IS NULL OR tag.id IS NULL OR tag.id = celtics_tag_id;

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'a reviewed Celtics player identity is missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review the listed identities and migration 080, then ROLLBACK and rerun the complete migration.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', 'professional',
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-10-24',
  'migration', '082_add_celtics_player_memberships'
)
FROM celtics_player_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = 'green-beer'
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM celtics_player_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.clan AS clan ON clan.slug = 'green-beer'
    JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed Celtics membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
