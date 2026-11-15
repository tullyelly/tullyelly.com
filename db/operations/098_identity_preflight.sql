-- READ ONLY. James checks the existing connection label/branch before running.
BEGIN READ ONLY;
SET LOCAL statement_timeout='30s';
SELECT current_database() AS database, current_user AS role,
       current_setting('transaction_read_only') AS read_only,
       current_setting('transaction_isolation') AS isolation,
       current_setting('neon.branch_id',true) AS branch_id;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '098: wrong database'; END IF;
  IF to_regclass('dojo.schema_migration') IS NULL THEN RAISE EXCEPTION '098: missing ledger; separately review initialization, do not run apply'; END IF;
END;
$target$;
SELECT filename,checksum,checksum_algorithm,status,applied_at,error_message FROM dojo.schema_migration WHERE filename LIKE '098%';
DO $history$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '098%' AND
    (filename<>'098_protect_homie_tag_identity.sql' OR checksum<>'ffbf357dcc0fa1e6d12cfc33818a5df2918219e742c1b678f31945a5eb9ea02f' OR checksum_algorithm<>'sha256'
      OR status<>'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '098: ledger conflict; stop';
  END IF;
END;
$history$;
DO $preflight$
BEGIN
IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql') THEN

  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '098: use READ COMMITTED'; END IF;
  IF EXISTS (SELECT 1 FROM (VALUES
      ('sync_homie_tag_identity','177e679656b0a4562f467f6653a11f1c'),
      ('sync_homie_tag_identity_from_row','4a09ee07ff90f14024d07d88db34db8c'),
      ('infer_tag_identity_from_canonical_route','44172b71b333653f7fd9d398b7a4e05d')) expected(name,body_hash)
    LEFT JOIN pg_proc p ON p.proname=expected.name AND p.pronamespace='dojo'::regnamespace
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r',''))<>expected.body_hash) THEN
    RAISE EXCEPTION '098: deployed synchronization/inference definition changed; review';
  END IF;
  IF EXISTS(SELECT 1 FROM (VALUES
      ('dojo.homie'::regclass,'trg_sync_homie_tag_identity','7e2ae0adea955331b8087ce1801a8a4a'),
      ('dojo.tags'::regclass,'trg_infer_tag_identity_from_canonical_route','0b3fe7ecdfc9144220290c78873c8f9e')) expected(table_id,name,definition_hash)
    LEFT JOIN pg_trigger t ON t.tgrelid=expected.table_id AND t.tgname=expected.name
    WHERE t.oid IS NULL OR t.tgenabled<>'O' OR md5(pg_get_triggerdef(t.oid))<>expected.definition_hash) THEN
    RAISE EXCEPTION '098: deployed synchronization/inference trigger changed; review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dojo.homie WHERE id=221 AND name='Cal Eldrid' AND drafted=1989 AND tag_slug IN ('cal','eldrid'))
     OR NOT EXISTS (SELECT 1 FROM dojo.homie WHERE id=219 AND name='László Kleinheisler' AND drafted=2016 AND tag_slug IN ('the-lazer','lazer-face')) THEN
    RAISE EXCEPTION '098: known athlete identity/customization changed; review before applying';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM dojo.tags WHERE id=33 AND slug='cal' AND name='cal' AND display_name='cal' AND href='/unclejimmy/fam/cal' AND href_kind IN ('homie','squad'))
     OR NOT EXISTS (SELECT 1 FROM dojo.tags WHERE id=274 AND slug='the-lazer' AND name='the-lazer' AND display_name IN ('lászló kleinheisler','the lazer') AND href='/unclejimmy/fam/the-lazer' AND href_kind='squad') THEN
    RAISE EXCEPTION '098: known family tag changed; preserve and review';
  END IF;
  IF (SELECT count(*) FROM dojo.tag_relation r JOIN dojo.tags t ON t.id=r.target_tag_id
      WHERE r.source_tag_id IN (33,274) AND r.relation_type='member_of' AND t.slug='g-league') <> 2 THEN
    RAISE EXCEPTION '098: reviewed family membership missing';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.tags WHERE slug IN ('cal','the-lazer') AND meta#>'{identity,contexts,cardattack}' IS NOT NULL
      AND meta#>'{identity,contexts,cardattack}' <> jsonb_build_object('role','homie','href','/cardattack/homies/'||slug)) THEN
    RAISE EXCEPTION '098: family CardAttack context has newer customization; review';
  END IF;

END IF;
END;
$preflight$;
SELECT id,name,tag_slug,drafted FROM dojo.homie WHERE id IN (219,221) ORDER BY id;
SELECT id,slug,display_name,href,href_kind,is_clickable,meta FROM dojo.tags WHERE slug IN ('cal','the-lazer','eldrid','lazer-face','g-league') ORDER BY slug;
SELECT s.slug AS source,t.slug AS target,r.* FROM dojo.tag_relation r JOIN dojo.tags s ON s.id=r.source_tag_id JOIN dojo.tags t ON t.id=r.target_tag_id WHERE s.slug IN ('cal','the-lazer','eldrid','lazer-face') OR t.slug IN ('cal','the-lazer','eldrid','lazer-face');
SELECT h.tag_slug,count(*) FROM dojo.homie h WHERE tag_slug IS NOT NULL GROUP BY tag_slug HAVING count(*)>1;
SELECT t.id,t.slug,t.href,t.meta FROM dojo.tags t WHERE t.meta#>>'{identity,contexts,cardattack,role}'='homie' AND NOT EXISTS(SELECT 1 FROM dojo.homie h WHERE h.tag_slug=t.slug) ORDER BY t.slug;
COMMIT;
