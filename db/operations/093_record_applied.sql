-- James-only ledger handoff for 093_add_jazz_player_memberships.sql.
-- Run AFTER successful migration application; development first, approved production next.
-- Verify original SHA-256 before execution. Rechecks all twelve installed memberships.
-- Reconciliation timestamps are current; original duration is unknown.
-- On failure, ROLLBACK in this session before rerunning this complete file.
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
WITH expected(homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) AS (VALUES
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
  ('Wes Matthews', 'wes', 'jazz', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf')
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
  AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
WHERE homie.id IS NULL OR target_tag.id IS NULL OR relation.id IS NULL
  OR (SELECT count(*) FROM dojo.homie AS candidate
      WHERE candidate.tag_slug = expected.source_slug) <> 1
  OR (clan.slug = 'jazz' AND clan.name IS DISTINCT FROM 'Utah Jazz')
  OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
  OR relation.meta->>'affiliation_scope' IS DISTINCT FROM expected.affiliation_scope
  OR NULLIF(relation.meta->>'evidence_url', '') IS NULL;
  IF effect_problems IS NOT NULL THEN
    RAISE EXCEPTION '093 memberships or evidence missing; apply and validate migration first'
      USING DETAIL = effect_problems;
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '093_add_jazz_player_memberships.sql'
      AND (checksum IS DISTINCT FROM '393c2679932ff59f302115e9aef6e58b3f393d1e4633c581cd096c9851215569'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL OR error_message IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '093 ledger conflicts with reviewed migration; aborting';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES ('093_add_jazz_player_memberships.sql',
  '393c2679932ff59f302115e9aef6e58b3f393d1e4633c581cd096c9851215569',
  'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;
COMMIT;
