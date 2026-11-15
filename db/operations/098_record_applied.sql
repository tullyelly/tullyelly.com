-- Generated offline. James runs this complete file ONLY after the canonical migration succeeds.
-- Canonical: db/migrations/098_protect_homie_tag_identity.sql; SHA-256: 06b31cda06f6b1b86e4d0788ca665a06e2fa28f6838056fd2aff70710aaab6a1
-- This file verifies effects and records history; it never replays the migration.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger_guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '098%' AND filename<>'098_protect_homie_tag_identity.sql') THEN
    RAISE EXCEPTION '098: migration number occupied';
  END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql' AND
    (checksum IS DISTINCT FROM '06b31cda06f6b1b86e4d0788ca665a06e2fa28f6838056fd2aff70710aaab6a1' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '098: conflicting or failed ledger history; stop for review';
  END IF;
END;
$ledger_guard$;
-- Required effect checks run before any history is recorded, including on reruns.
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '098: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '098: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
DO $effects$
BEGIN
  PERFORM dojo.assert_homie_tag_exclusivity();
  IF NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=219 AND name='László Kleinheisler' AND drafted=2016 AND tag_slug='lazer-face')
     OR NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=221 AND name='Cal Eldrid' AND drafted=1989 AND tag_slug='eldrid') THEN
    RAISE EXCEPTION '098: athlete identity/slug mismatch';
  END IF;
  IF (SELECT count(*) FROM dojo.tags WHERE (id,slug,display_name,href,href_kind) IN
     ((33,'cal','cal','/unclejimmy/fam/cal','squad'),(274,'the-lazer','the lazer','/unclejimmy/fam/the-lazer','squad'))
     AND meta#>>'{identity,kind}'='person' AND meta#>>'{identity,contexts,unclejimmy,role}'='fam'
     AND meta#>>'{identity,contexts,unclejimmy,href}'=href AND meta#>'{identity,contexts,cardattack}' IS NULL)<>2 THEN
    RAISE EXCEPTION '098: family labels/routes/context mismatch';
  END IF;
  IF (SELECT count(*) FROM dojo.tag_relation r JOIN dojo.tags target ON target.id=r.target_tag_id
      WHERE r.source_tag_id IN (33,274) AND r.relation_type='member_of' AND target.slug='g-league')<>2
     OR EXISTS(SELECT 1 FROM dojo.tag_relation r JOIN dojo.tags s ON s.id=r.source_tag_id JOIN dojo.tags t ON t.id=r.target_tag_id
       WHERE s.slug IN ('eldrid','lazer-face') AND t.slug='g-league' AND r.relation_type='member_of') THEN
    RAISE EXCEPTION '098: family membership preservation failed';
  END IF;
  IF (SELECT count(*) FROM dojo.homie h JOIN dojo.tags t ON t.slug=h.tag_slug WHERE h.id IN (219,221)
      AND t.href='/cardattack/homies/'||h.tag_slug AND t.href_kind='homie'
      AND t.meta#>>'{identity,contexts,cardattack,role}'='homie'
      AND t.meta#>>'{identity,contexts,cardattack,href}'=t.href
      AND t.meta#>>'{homie_sync,homie_id}'=h.id::text)<>2 THEN
    RAISE EXCEPTION '098: current athlete tag mismatch';
  END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
      'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass)
      AND ((tgname='trg_00_homie_identity_lock' AND tgfoid='dojo.homie_identity_write_lock()'::regprocedure AND tgtype=30)
        OR (tgname='trg_zz_homie_identity_check' AND tgfoid='dojo.check_homie_tag_exclusivity()'::regprocedure AND tgtype=28)) AND tgenabled='O')<>8 THEN
    RAISE EXCEPTION '098: enabled statement guards missing';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='dojo.homie'::regclass AND tgname='trg_sync_homie_tag_identity'
      AND tgfoid='dojo.sync_homie_tag_identity_from_row()'::regprocedure AND tgtype=21 AND tgqual IS NULL AND tgenabled='O') THEN
    RAISE EXCEPTION '098: null-capable row synchronization trigger missing/changed';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='dojo.tags'::regclass AND tgname='trg_infer_tag_identity_from_canonical_route' AND tgenabled='O') THEN
    RAISE EXCEPTION '098: existing inference trigger missing/disabled';
  END IF;
END;
$effects$;
DO $definitions$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES ('homie_identity_write_lock','f43f82285630975f2a1b6b71f6ff6a21'),
('homie_tag_reserved_reason','4b983fc69896fca7add5ced6a0f3dff8'),
('assert_homie_tag_exclusivity','f7a278d0b52d938c719d80aaaf5dffea'),
('check_homie_tag_exclusivity','0def4410ddbaee07dc66fcf025aca183'),
('sync_homie_tag_identity','7aee15861f451f69524c206d17ff4767'),
('retire_homie_tag','2cfe6ec1f81e0787c4ff1535e6cea255'),
('sync_homie_tag_identity_from_row','2e89e490bfccbff959f5904a0bfe2eae'),('infer_tag_identity_from_canonical_route','44172b71b333653f7fd9d398b7a4e05d')) expected(name,body_hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=expected.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r',''))<>expected.body_hash) THEN
    RAISE EXCEPTION '098: installed function differs from reviewed migration';
  END IF;
END;
$definitions$;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
SELECT '098_protect_homie_tag_identity.sql','06b31cda06f6b1b86e4d0788ca665a06e2fa28f6838056fd2aff70710aaab6a1','sha256','applied',now(),now(),NULL,NULL
WHERE NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql');
COMMIT;
