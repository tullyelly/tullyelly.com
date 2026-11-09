-- James-only ledger handoff for 097_add_spurs_player_memberships.sql.
-- Run AFTER successful migration application; development first, approved production next.
-- Verify original SHA-256 before execution. Rechecks all twenty-one installed memberships.
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
  ('Victor Wembanyama', 'wemby', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster')
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
  OR (clan.slug = 'the-monastery' AND clan.name IS DISTINCT FROM 'San Antonio Spurs')
  OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
  OR relation.meta->>'affiliation_scope' IS DISTINCT FROM expected.affiliation_scope
  OR NULLIF(relation.meta->>'evidence_url', '') IS NULL;
  IF effect_problems IS NOT NULL THEN
    RAISE EXCEPTION '097 memberships or evidence missing; apply and validate migration first'
      USING DETAIL = effect_problems;
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '097_add_spurs_player_memberships.sql'
      AND (checksum IS DISTINCT FROM '95908765f92870c509d8a0428e762dc47101ded5c498c29574bf0115d5dab485'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL OR error_message IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '097 ledger conflicts with reviewed migration; aborting';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES ('097_add_spurs_player_memberships.sql',
  '95908765f92870c509d8a0428e762dc47101ded5c498c29574bf0115d5dab485',
  'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;
COMMIT;
