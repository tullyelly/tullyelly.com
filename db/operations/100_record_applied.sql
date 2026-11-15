-- Generated offline. James runs this complete file ONLY after the canonical migration succeeds.
-- Canonical: db/migrations/100_validate_typed_tag_relationships.sql; SHA-256: 717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31
-- This file verifies effects and records history; it never replays the migration.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger_guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '100%' AND filename<>'100_validate_typed_tag_relationships.sql') THEN
    RAISE EXCEPTION '100: migration number occupied';
  END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='100_validate_typed_tag_relationships.sql' AND
    (checksum IS DISTINCT FROM '717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '100: conflicting or failed ledger history; stop for review';
  END IF;
END;
$ledger_guard$;
-- Required effect checks run before any history is recorded, including on reruns.
SET LOCAL search_path=pg_catalog;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '100: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '100: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ('valid_collection_reasons','2d0f9227f4881e7ea62fe40176082106'),
('canonical_tag_id','4417c7f748647547809d87c67411e1cc'),
('tag_known_owner','50a36699b09edd5e050658df6f4bdcf1'),
('assert_typed_tag_relationships','b2420bcbf363f839a2b2fa6284c5223c'),
('check_typed_tag_relationships','2ec2825570975d3d9fa7e607b03d13a5')) e(name,hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=e.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r\n',E'\n'))<>e.hash) THEN
    RAISE EXCEPTION '100: installed definitions differ; stop for review';
  END IF;
END;
$definitions$;
DO $effects$
BEGIN
  PERFORM dojo.assert_typed_tag_relationships();
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_zy_typed_relationship_check' AND tgfoid='dojo.check_typed_tag_relationships()'::regprocedure
    AND tgtype=28 AND tgenabled='O')<>5 THEN RAISE EXCEPTION '100: typed statement checks missing/disabled'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_00_homie_identity_lock' AND tgfoid='dojo.homie_identity_write_lock()'::regprocedure
    AND tgtype=30 AND tgenabled='O')<>5 THEN RAISE EXCEPTION '100: shared locks missing/disabled'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_index WHERE indexrelid=to_regclass('dojo.tag_relation_one_alias_target_idx')
    AND indisunique AND indisvalid AND indpred IS NOT NULL) THEN RAISE EXCEPTION '100: alias uniqueness index missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='dojo.tag_relation'::regclass
    AND conname='tag_relation_reasons_check' AND convalidated) THEN RAISE EXCEPTION '100: reasons constraint missing'; END IF;
END;
$effects$;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
SELECT '100_validate_typed_tag_relationships.sql','717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31','sha256','applied',now(),now(),NULL,NULL
WHERE NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='100_validate_typed_tag_relationships.sql');
COMMIT;
