-- WU-1226; James-only DataGrip handoff, development first, then approved production.
-- Records James's reported successful execution of the unchanged migration 089.
-- Reconciliation timestamps are recorded now; original execution time/duration is unknown.
-- Do not rerun the migration. Review the target and file SHA-256 before execution.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cipher:schema-migrations'));
LOCK TABLE dojo.homie, dojo.clan, dojo.tags, dojo.tag_relation IN SHARE MODE;

DO $test$
DECLARE
  expected RECORD;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('alvin-robertson'),
      ('chris-bosh'),
      ('dj'),
      ('dell'),
      ('the-dream'),
      ('jalen-rose'),
      ('nwora'),
      ('kwhhyyy'),
      ('lindsey'),
      ('pops-junior'),
      ('barnes'),
      ('shawn-respert'),
      ('t-j-ford'),
      ('terence'),
      ('t-mac'),
      ('vince-carter')
    ) AS seed(source_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source_tag ON source_tag.id = relation.source_tag_id
      JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
      JOIN dojo.clan AS clan ON clan.slug = target_tag.slug
      WHERE source_tag.slug = expected.source_slug AND clan.slug = 'raptors'
        AND relation.relation_type = 'member_of'
    ) THEN
      RAISE EXCEPTION 'expected Raptors membership missing for %', expected.source_slug;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
    WHERE relation.meta->>'migration' = '089_add_raptors_player_memberships'
      AND (target_tag.slug <> 'raptors'
        OR relation.relation_type <> 'member_of'
        OR relation.meta->>'affiliation_scope' IS DISTINCT FROM 'professional'
        OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
        OR NULLIF(relation.meta->>'evidence_url', '') IS NULL)
  ) THEN
    RAISE EXCEPTION 'Raptors membership target or evidence metadata is incorrect';
  END IF;
END;
$test$;


DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '089_add_raptors_player_memberships.sql'
      AND (checksum IS DISTINCT FROM '9c0456a0a3617320dd0ae583ebe8fadaa3ccd81aa01efc446d775285af99bdce'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL)
  ) THEN
    RAISE EXCEPTION '089 ledger conflicts with reviewed execution; aborting reconciliation';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES
  ('089_add_raptors_player_memberships.sql',
   '9c0456a0a3617320dd0ae583ebe8fadaa3ccd81aa01efc446d775285af99bdce',
   'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;

COMMIT;
