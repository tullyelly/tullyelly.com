-- OPTIONAL James-only engineering probe in EXISTING DEVELOPMENT after 101.
-- Writes rollback fixtures. Cipher must not execute. Not part of normal handoff.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $test$
DECLARE original_tag integer; alias_tag integer; current_tag integer; edge_id bigint; lulu integer; failed boolean;
BEGIN
  IF current_database()<>'tullyelly_db' OR NOT EXISTS(SELECT 1 FROM dojo.schema_migration
    WHERE filename='101_retarget_homie_alias_references.sql' AND status='applied') THEN
    RAISE EXCEPTION '101 test: expected applied development package'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=221 AND name='Cal Eldrid' AND tag_slug='eldrid') THEN
    RAISE EXCEPTION '101 test: reviewed athlete changed; do not overwrite'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tags WHERE slug IN ('wu1264-athlete-alt','wu1264-step-b','wu1264-step-c')) THEN
    RAISE EXCEPTION '101 test: fixture occupied; do not overwrite'; END IF;
  SELECT id INTO STRICT original_tag FROM dojo.tags WHERE slug='eldrid';
  SELECT id INTO STRICT lulu FROM dojo.tags WHERE slug='lulu';
  INSERT INTO dojo.tags(slug,name,meta) VALUES('wu1264-athlete-alt','wu1264-athlete-alt',
    '{"identity":{"kind":"person"},"homie_sync":{"homie_id":221,"retired":true}}') RETURNING id INTO alias_tag;
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
    VALUES(alias_tag,original_tag,'alias_of','{"review":"rollback fixture"}');
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
    VALUES(original_tag,lulu,'collected_because_of','{"evidence":"rollback fixture","reasons":[{"code":"shared_name","explanation":"Rollback fixture only."}]}') RETURNING id INTO edge_id;
  UPDATE dojo.homie SET tag_slug='wu1264-step-b' WHERE id=221;
  UPDATE dojo.homie SET tag_slug='wu1264-step-c' WHERE id=221;
  SELECT id INTO STRICT current_tag FROM dojo.tags WHERE slug='wu1264-step-c';
  IF dojo.canonical_tag_id(alias_tag)<>current_tag OR dojo.canonical_tag_id(original_tag)<>current_tag
    OR NOT EXISTS(SELECT 1 FROM dojo.tag_relation WHERE id=edge_id AND source_tag_id=current_tag AND target_tag_id=lulu
      AND meta->>'evidence'='rollback fixture' AND jsonb_array_length(meta->'homie_alias_retarget_history')=2) THEN
    RAISE EXCEPTION '101 test: A -> B -> C identity/evidence not preserved'; END IF;
  UPDATE dojo.homie SET tag_slug='eldrid' WHERE id=221;
  IF dojo.canonical_tag_id(alias_tag)<>original_tag OR NOT EXISTS(SELECT 1 FROM dojo.tag_relation WHERE id=edge_id AND source_tag_id=original_tag) THEN
    RAISE EXCEPTION '101 test: returning to a prior alias failed'; END IF;
  failed := false;
  BEGIN UPDATE dojo.homie SET tag_slug=NULL WHERE id=221;
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE '%null slug would strand%' THEN RAISE; END IF;
    failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION '101 test: null transition stranded references'; END IF;
  failed := false;
  BEGIN UPDATE dojo.homie SET tag_slug='cal' WHERE id=221;
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE '%reserved identity%' THEN RAISE; END IF;
    failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION '101 test: family collision accepted'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE slug='cal' AND href='/unclejimmy/fam/cal') THEN
    RAISE EXCEPTION '101 test: family identity moved'; END IF;
  PERFORM dojo.assert_typed_tag_relationships();
END;
$test$;
ROLLBACK;
