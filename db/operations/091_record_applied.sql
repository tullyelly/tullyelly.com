-- James-only DataGrip handoff: existing development first, then approved production.
-- Records reported successful execution of unchanged migration 091; does not replay it.
-- Verify target and original file SHA-256 before running this complete transaction.
-- Timestamps record reconciliation now; original execution time/duration is unknown.
-- On failure, ROLLBACK in this session before retrying the complete file.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(hashtext('cipher:schema-migrations'));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.homie, dojo.clan, dojo.tags, dojo.tag_relation IN SHARE MODE;

DO $effects$
DECLARE
  effect_problems TEXT;
BEGIN
    WITH expected(homie_name, source_slug, clan_slug, evidence_url) AS (VALUES
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
  ('Tyler Herro', 'herro', 'bucks-n-six', 'https://www.nba.com/bucks/game/0022600138-rockets-vs-bucks-milwaukee-wi-10-28-2026/event-details')
    )
    SELECT string_agg(expected.source_slug || ' -> ' || expected.clan_slug, E'\n'
      ORDER BY expected.source_slug, expected.clan_slug) INTO effect_problems
    FROM expected
    LEFT JOIN dojo.homie AS homie
      ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
    LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
    LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
    LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id
      AND relation.relation_type = 'member_of'
    WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
      OR relation.id IS NULL
      OR (SELECT count(*) FROM dojo.homie AS candidate
          WHERE candidate.tag_slug = expected.source_slug) <> 1
      OR relation.meta->>'migration' IS DISTINCT FROM '091_complete_homie_clan_memberships'
      OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
      OR NULLIF(relation.meta->>'evidence_url', '') IS NULL
      OR relation.meta->>'affiliation_scope' IS DISTINCT FROM 'professional'
      OR relation.meta->>'evidence_url' IS DISTINCT FROM expected.evidence_url;

  IF effect_problems IS NOT NULL THEN
    RAISE EXCEPTION '091 installed memberships or evidence differ from reviewed execution'
      USING DETAIL = effect_problems;
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '091_complete_homie_clan_memberships.sql'
      AND (checksum IS DISTINCT FROM '0ea3f65bb3212087460f36d6c33c946d5bceb20684e1331213dd37b036adff7f'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL
        OR error_message IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '091 ledger conflicts with reviewed execution; aborting reconciliation';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES
  ('091_complete_homie_clan_memberships.sql',
   '0ea3f65bb3212087460f36d6c33c946d5bceb20684e1331213dd37b036adff7f',
   'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;

COMMIT;
