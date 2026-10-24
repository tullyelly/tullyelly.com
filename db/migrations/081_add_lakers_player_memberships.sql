-- 081_add_lakers_player_memberships.sql
-- Reviewed against production and refreshed development on 2026-10-24.
-- Manual execution only; existing player identities come from migration 080.
-- These are verified playing-career affiliations, not a current-roster feed.
-- After a failed attempt, ROLLBACK before rerunning the complete file.
SET search_path = dojo, auth, public;

BEGIN;

LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;

CREATE TEMP TABLE lakers_player_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT PRIMARY KEY,
  evidence_url TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO lakers_player_seed (homie_name, source_slug, evidence_url) VALUES
  ('Andrew Bogut', 'andrew-bogut', 'https://www.nba.com/lakers/releases/180106-bogut-waived'),
  ('Anthony Davis', 'ad', 'https://www.nba.com/lakers/team/player-pages/anthony-davis-203076'),
  ('Brook Lopez', 'splash-mountain', 'https://www.nba.com/news/milwaukee-bucks-sign-brook-lopez-official-release'),
  ('Carmelo Anthony', 'carmelo-anthony', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Dennis Rodman', 'dennis-rodman', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Gary Payton', 'the-glove', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Joe Smith', 'joe-smith', 'https://www.nba.com/player/693'),
  ('Kareem Abdul-Jabbar', 'kareem', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Karl Malone', 'karl-malone', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Kobe Bryant', 'kobe', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Kostas Antetokounmpo', 'kostas-antetokounmpo', 'https://www.nba.com/player/1628961/kostas-antetokounmpo/stats'),
  ('Lebron James', 'lebron-james', 'https://www.nba.com/news/lebron-james-lakers-legacy-closes'),
  ('Luka Doncic', 'luka', 'https://www.nba.com/lakers/history/history-day-in-photos-lukas-first-game'),
  ('Magic Johnson', 'magic', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Mitch Richmond', 'mitch-richmond', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Pau Gasol', 'pau-gasol', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Shaquille O''Neal', 'diesel', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Sterling Brown', 'sterling-brown', 'https://www.nba.com/lakers/news/stay-ready-lakers-pluck-hawks-wings-01-06-23'),
  ('Steve Nash', 'nash', 'https://www.nba.com/team/1610612747/lakers/roster'),
  ('Wes Matthews', 'wes-matthews', 'https://www.nba.com/news/bucks-bring-back-veteran-wesley-matthews');

DO $check$
DECLARE
  lakers_tag_id INTEGER;
  endpoint_problems TEXT;
BEGIN
  SELECT tag.id INTO lakers_tag_id
  FROM dojo.clan AS clan
  JOIN dojo.tags AS tag ON tag.slug = clan.slug
  WHERE clan.slug = 'purple-and-gold';

  IF lakers_tag_id IS NULL THEN
    RAISE EXCEPTION 'Lakers clan or canonical tag is missing: purple-and-gold'
      USING HINT = 'Check the intended database and Lakers clan/tag, then ROLLBACK and rerun the complete migration.';
  END IF;

  SELECT string_agg(
    format('%s [%s -> purple-and-gold]: %s', seed.homie_name, seed.source_slug,
      concat_ws(', ',
        CASE WHEN homie.id IS NULL THEN 'homie name/tag assignment missing or changed' END,
        CASE WHEN tag.id IS NULL THEN 'player tag missing' END,
        CASE WHEN tag.id = lakers_tag_id THEN 'player and Lakers share one tag' END
      )), E'\n' ORDER BY seed.homie_name
  ) INTO endpoint_problems
  FROM lakers_player_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS tag ON tag.slug = seed.source_slug
  WHERE homie.id IS NULL OR tag.id IS NULL OR tag.id = lakers_tag_id;

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'a reviewed Lakers player identity is missing or changed; transaction aborted'
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
  'migration', '081_add_lakers_player_memberships'
)
FROM lakers_player_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = 'purple-and-gold'
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lakers_player_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.clan AS clan ON clan.slug = 'purple-and-gold'
    JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed Lakers membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
