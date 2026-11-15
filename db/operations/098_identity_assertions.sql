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
