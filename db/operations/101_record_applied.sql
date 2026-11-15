-- Generated offline. James runs this complete file ONLY after the canonical migration succeeds.
-- Canonical: db/migrations/101_retarget_homie_alias_references.sql; SHA-256: 24541ff0961e7f3e9a5d452984bbd7a8c32cf2f07778d328c2b2ec527b640470
-- This file verifies effects and records history; it never replays the migration.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger_guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '101%' AND filename<>'101_retarget_homie_alias_references.sql') THEN
    RAISE EXCEPTION '101: migration number occupied';
  END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='101_retarget_homie_alias_references.sql' AND
    (checksum IS DISTINCT FROM '24541ff0961e7f3e9a5d452984bbd7a8c32cf2f07778d328c2b2ec527b640470' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '101: conflicting or failed ledger history; stop for review';
  END IF;
END;
$ledger_guard$;
-- Required effect checks run before any history is recorded, including on reruns.
SET LOCAL search_path=pg_catalog;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '101: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '101: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ('prepare_homie_alias_rename','16959c2860a4c603f282502826da3856'),
('sync_homie_tag_identity_from_row','95367f325cd6be90f29ff85d42ce6e21')) e(name,hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=e.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r\n',E'\n'))<>e.hash) THEN
    RAISE EXCEPTION '101: installed definitions differ; stop for review';
  END IF;
END;
$definitions$;
DO $effects$
BEGIN
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_00_homie_identity_lock' AND tgfoid='dojo.homie_identity_write_lock()'::regprocedure
    AND tgtype=30 AND tgenabled='O')<>5 OR
    (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_zy_typed_relationship_check' AND tgfoid='dojo.check_typed_tag_relationships()'::regprocedure
    AND tgtype=28 AND tgenabled='O')<>5 THEN
    RAISE EXCEPTION '101: shared locks or typed statement checks missing/disabled'; END IF;
  PERFORM dojo.assert_homie_tag_exclusivity();
  PERFORM dojo.assert_typed_tag_relationships();
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='dojo.homie'::regclass AND tgname='trg_01_prepare_homie_alias_rename'
    AND tgfoid='dojo.prepare_homie_alias_rename()'::regprocedure AND tgtype=19 AND tgenabled='O') THEN
    RAISE EXCEPTION '101: rename preparation trigger missing/disabled'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='dojo.homie'::regclass AND tgname='trg_sync_homie_tag_identity'
    AND tgfoid='dojo.sync_homie_tag_identity_from_row()'::regprocedure AND tgtype=21 AND tgenabled='O') THEN
    RAISE EXCEPTION '101: synchronization trigger missing/disabled'; END IF;
END;
$effects$;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
SELECT '101_retarget_homie_alias_references.sql','24541ff0961e7f3e9a5d452984bbd7a8c32cf2f07778d328c2b2ec527b640470','sha256','applied',now(),now(),NULL,NULL
WHERE NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='101_retarget_homie_alias_references.sql');
COMMIT;
