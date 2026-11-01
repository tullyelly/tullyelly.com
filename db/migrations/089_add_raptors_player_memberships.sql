-- 089_add_raptors_player_memberships.sql
-- Reviewed against existing development and production on 2026-10-31.
-- Manual execution only; requires the existing homie and clan tag identities.
-- These are verified playing-career affiliations, not a current-roster feed.
-- After a failed attempt, ROLLBACK before rerunning the complete file.
SET search_path = dojo, auth, public;

BEGIN;

LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;

CREATE TEMP TABLE raptors_player_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT PRIMARY KEY,
  evidence_url TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO raptors_player_seed (homie_name, source_slug, evidence_url) VALUES
  ('Alvin Robertson', 'alvin-robertson', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Chris Bosh', 'chris-bosh', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('D.J. Wilson', 'dj', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Dell Curry', 'dell', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Hakeem Olajuwon', 'the-dream', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Jalen Rose', 'jalen-rose', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Jordan Nwora', 'nwora', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Kawhi Leonard', 'kwhhyyy', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Lindsey Hunter', 'lindsey', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('P.J. Tucker', 'pops-junior', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Scottie Barnes', 'barnes', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Shawn Respert', 'shawn-respert', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('T.J. Ford', 't-j-ford', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Terence Davis II', 'terence', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Tracy McGrady', 't-mac', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen'),
  ('Vince Carter', 'vince-carter', 'https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen');

DO $check$
DECLARE
  raptors_tag_id INTEGER;
  endpoint_problems TEXT;
BEGIN
  SELECT tag.id INTO raptors_tag_id
  FROM dojo.clan AS clan
  JOIN dojo.tags AS tag ON tag.slug = clan.slug
  WHERE clan.slug = 'raptors';

  IF raptors_tag_id IS NULL THEN
    RAISE EXCEPTION 'Raptors clan or canonical tag is missing: raptors'
      USING HINT = 'Check the intended database and Raptors clan/tag, then ROLLBACK and rerun the complete migration.';
  END IF;

  SELECT string_agg(
    format('%s [%s -> raptors]: %s', seed.homie_name, seed.source_slug,
      concat_ws(', ',
        CASE WHEN homie.id IS NULL THEN 'homie name/tag assignment missing or changed' END,
        CASE WHEN tag.id IS NULL THEN 'player tag missing' END,
        CASE WHEN tag.id = raptors_tag_id THEN 'player and Raptors share one tag' END
      )), E'\n' ORDER BY seed.homie_name
  ) INTO endpoint_problems
  FROM raptors_player_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS tag ON tag.slug = seed.source_slug
  WHERE homie.id IS NULL OR tag.id IS NULL OR tag.id = raptors_tag_id;

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'a reviewed Raptors player identity is missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review the listed identities, then ROLLBACK and rerun the complete migration.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', 'professional',
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-10-31',
  'migration', '089_add_raptors_player_memberships'
)
FROM raptors_player_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = 'raptors'
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM raptors_player_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.clan AS clan ON clan.slug = 'raptors'
    JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed Raptors membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
