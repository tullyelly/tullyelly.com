-- 087_add_marquette_player_memberships.sql
-- Reviewed against production on 2026-10-25.
-- Manual execution only; requires the existing homie and clan tag identities.
-- These are verified playing-career affiliations, not a current-roster feed.
-- After a failed attempt, ROLLBACK before rerunning the complete file.
SET search_path = dojo, auth, public;

BEGIN;

LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;

CREATE TEMP TABLE marquette_player_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT PRIMARY KEY,
  evidence_url TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO marquette_player_seed (homie_name, source_slug, evidence_url) VALUES
  ('Dwyane Wade', 'flash', 'https://gomarquette.com/news/2006/2/13/Marquette_Players_in_the_NBA'),
  ('Jimmy Butler', 'playoff-jimmy', 'https://gomarquette.com/documents/download/2018/5/17/_marq_m_baskbl__mu_eastregional.pdf'),
  ('Wes Matthews', 'wes-matthews', 'https://gomarquette.com/news/2009/10/26/wesley_matthews_earns_opportunity_to_live_dream_play_in_nba');

DO $check$
DECLARE
  marquette_tag_id INTEGER;
  endpoint_problems TEXT;
BEGIN
  SELECT tag.id INTO marquette_tag_id
  FROM dojo.clan AS clan
  JOIN dojo.tags AS tag ON tag.slug = clan.slug
  WHERE clan.slug = 'golden-eagles';

  IF marquette_tag_id IS NULL THEN
    RAISE EXCEPTION 'Marquette clan or canonical tag is missing: golden-eagles'
      USING HINT = 'Check the intended database and Marquette clan/tag, then ROLLBACK and rerun the complete migration.';
  END IF;

  SELECT string_agg(
    format('%s [%s -> golden-eagles]: %s', seed.homie_name, seed.source_slug,
      concat_ws(', ',
        CASE WHEN homie.id IS NULL THEN 'homie name/tag assignment missing or changed' END,
        CASE WHEN tag.id IS NULL THEN 'player tag missing' END,
        CASE WHEN tag.id = marquette_tag_id THEN 'player and Marquette share one tag' END
      )), E'\n' ORDER BY seed.homie_name
  ) INTO endpoint_problems
  FROM marquette_player_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS tag ON tag.slug = seed.source_slug
  WHERE homie.id IS NULL OR tag.id IS NULL OR tag.id = marquette_tag_id;

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'a reviewed Marquette player identity is missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review the listed identities, then ROLLBACK and rerun the complete migration.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', 'college',
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-10-25',
  'migration', '087_add_marquette_player_memberships'
)
FROM marquette_player_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = 'golden-eagles'
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM marquette_player_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.clan AS clan ON clan.slug = 'golden-eagles'
    JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed Marquette membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
