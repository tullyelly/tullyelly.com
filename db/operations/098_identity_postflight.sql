-- READ ONLY. Effects plus exact canonical ledger record, not deployment proof.
BEGIN READ ONLY;
SET LOCAL statement_timeout='30s';
-- Transaction-free assertions; embedded in the canonical/atomic package.
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
      AND tgname IN ('trg_00_homie_identity_lock','trg_zz_homie_identity_check') AND tgenabled='O')<>8 THEN
    RAISE EXCEPTION '098: enabled statement guards missing';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='dojo.tags'::regclass AND tgname='trg_infer_tag_identity_from_canonical_route' AND tgenabled='O') THEN
    RAISE EXCEPTION '098: existing inference trigger missing/disabled';
  END IF;
END;
$effects$;

DO $ledger$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql'
    AND checksum='ffbf357dcc0fa1e6d12cfc33818a5df2918219e742c1b678f31945a5eb9ea02f' AND checksum_algorithm='sha256' AND status='applied' AND applied_at IS NOT NULL AND error_message IS NULL)
    OR EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '098%' AND filename<>'098_protect_homie_tag_identity.sql') THEN
    RAISE EXCEPTION '098: exact canonical ledger record missing/conflicting';
  END IF;
END;
$ledger$;
SELECT filename,checksum,checksum_algorithm,status,applied_at,attempted_at,error_message FROM dojo.schema_migration WHERE filename LIKE '098%';
-- BEGIN GENERATED DEFINITION CHECKS
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
    RAISE EXCEPTION '098: installed function body differs from reviewed source';
  END IF;
END;
$definitions$;
-- END GENERATED DEFINITION CHECKS
COMMIT;
