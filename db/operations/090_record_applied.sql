-- James-only DataGrip handoff: existing development first, then approved production.
-- Records reported successful execution of unchanged migration 090; does not replay it.
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
    WITH expected(homie_name, source_slug, legacy_slug, clan_slug) AS (VALUES
  ('Dennis Rodman', 'the-worm', 'dennis-rodman', 'purple-and-gold'),
  ('Desmond Mason', 'desmond', 'desmond-mason', 'bucks-n-six'),
  ('Dikembe Mutombo', 'dikembe', 'dikembe-mutombo', 'rockets'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'blazers'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'heat-culture'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'rockets'),
  ('Pau Gasol', 'pau', 'pau-gasol', 'bucks-n-six'),
  ('Pau Gasol', 'pau', 'pau-gasol', 'purple-and-gold'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'blazers'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'bucks-n-six'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'golden-eagles'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'purple-and-gold')
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
    LEFT JOIN dojo.tags AS legacy_tag ON legacy_tag.slug = expected.legacy_slug
    LEFT JOIN dojo.tag_relation AS legacy_relation
      ON legacy_relation.source_tag_id = legacy_tag.id
      AND legacy_relation.target_tag_id = target_tag.id
      AND legacy_relation.relation_type = 'member_of'
    WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
      OR relation.id IS NULL
      OR (SELECT count(*) FROM dojo.homie AS candidate
          WHERE candidate.tag_slug = expected.source_slug) <> 1
      OR relation.meta->>'migration' IS DISTINCT FROM '090_restore_homie_alias_memberships'
      OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
      OR NULLIF(relation.meta->>'evidence_url', '') IS NULL
      OR legacy_relation.id IS NULL
      OR relation.meta->>'copied_from_slug' IS DISTINCT FROM expected.legacy_slug
      OR relation.meta->>'affiliation_scope' IS DISTINCT FROM legacy_relation.meta->>'affiliation_scope'
      OR relation.meta->>'evidence_url' IS DISTINCT FROM legacy_relation.meta->>'evidence_url';

  IF effect_problems IS NOT NULL THEN
    RAISE EXCEPTION '090 installed memberships or evidence differ from reviewed execution'
      USING DETAIL = effect_problems;
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.schema_migration
    WHERE filename = '090_restore_homie_alias_memberships.sql'
      AND (checksum IS DISTINCT FROM 'ebc4ef13882e91d3f2872a7158502474539b4d843dbc5d49beef177a74280113'
        OR checksum_algorithm IS DISTINCT FROM 'sha256'
        OR status IS DISTINCT FROM 'applied'
        OR applied_at IS NULL
        OR error_message IS NOT NULL)
  ) THEN
    RAISE EXCEPTION '090 ledger conflicts with reviewed execution; aborting reconciliation';
  END IF;
END;
$ledger$;

INSERT INTO dojo.schema_migration
  (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
VALUES
  ('090_restore_homie_alias_memberships.sql',
   'ebc4ef13882e91d3f2872a7158502474539b4d843dbc5d49beef177a74280113',
   'sha256', 'applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)
ON CONFLICT (filename) DO NOTHING;

COMMIT;
