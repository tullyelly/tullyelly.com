-- James-only ledger handoff for 092_add_michigan_and_restore_traylor_memberships.sql.
-- Run AFTER successful migration application; development first, approved production next.
-- Verify original SHA-256 before execution. Rechecks all eight installed memberships.
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
  ('Charles Woodson', 'charles-woodson', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history'),
  ('Chris Webber', 'timeout', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('D.J. Wilson', 'dj', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/wolverines-in-professional-basketball'),
  ('Desmond Howard', 'desmond-howard', 'fab-five', 'college', 'https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history'),
  ('Jalen Rose', 'jalen-rose', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('Juwan Howard', 'juwan', 'fab-five', 'college', 'https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943'),
  ('Tractor Traylor', 'tractor', 'fab-five', 'college', 'https://mgoblue.com/documents/download/2021/11/5/bkm_honors_awards.pdf'),
  ('Tractor Traylor', 'tractor', 'bucks-n-six', 'professional', 'https://www.nba.com/game/mil-vs-bos-0029800446/box-score')
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
  OR (clan.slug = 'fab-five' AND clan.name IS DISTINCT FROM 'Michigan Wolverines')
  OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
  OR relation.meta->>'affiliation_scope' IS DISTINCT FROM expected.affiliation_scope
  OR NULLIF(relation.meta->>'evidence_url', '') IS NULL;
  IF effect_problems IS NOT NULL THEN
    RAISE EXCEPTION '092 memberships or evidence missing; apply and validate migration first'
      USING DETAIL = effect_problems;
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '092_add_michigan_and_restore_traylor_memberships.sql'
      AND (checksum IS DISTINCT FROM '312e55bdb833c3174ce37fcf9b5d9cace32c81addc5b79d2288edea76573d508'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL OR error_message IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '092 ledger conflicts with reviewed migration; aborting';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES ('092_add_michigan_and_restore_traylor_memberships.sql',
  '312e55bdb833c3174ce37fcf9b5d9cace32c81addc5b79d2288edea76573d508',
  'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;
COMMIT;
