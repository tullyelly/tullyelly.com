-- OPTIONAL engineering test; James only, existing development, after migration 100, before WU-1267 real seeds.
-- Writes rollback fixtures; Cipher must not execute. Not part of the two-file handoff.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' OR NOT EXISTS(SELECT 1 FROM dojo.schema_migration
    WHERE filename='100_validate_typed_tag_relationships.sql' AND status='applied') THEN
    RAISE EXCEPTION '100 test: expected applied development package';
  END IF;
END;
$target$;
CREATE FUNCTION pg_temp.expect_typed_rejection(statement text, message_pattern text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM !~ message_pattern THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION '100 test: statement unexpectedly accepted: %',statement; END IF;
END;
$fn$;
DO $behavior$
DECLARE alt integer; athlete_alt integer; cal integer; lulu integer; athlete integer; other_athlete integer;
BEGIN
  SELECT id INTO STRICT cal FROM dojo.tags WHERE slug='cal';
  SELECT id INTO STRICT lulu FROM dojo.tags WHERE slug='lulu';
  SELECT t.id INTO STRICT athlete FROM dojo.tags t JOIN dojo.homie h ON h.tag_slug=t.slug WHERE h.id=6;
  SELECT t.id INTO STRICT other_athlete FROM dojo.tags t JOIN dojo.homie h ON h.tag_slug=t.slug WHERE h.id=221;
  IF EXISTS(SELECT 1 FROM dojo.tags WHERE slug IN ('wu1263-test-family-alt','wu1263-test-athlete-alt','wu1263-test-renamed')) THEN
    RAISE EXCEPTION '100 test: fixture slug occupied; do not overwrite';
  END IF;
  INSERT INTO dojo.tags(slug,name,meta) VALUES('wu1263-test-family-alt','wu1263-test-family-alt','{}') RETURNING id INTO alt;
  INSERT INTO dojo.tags(slug,name,meta) VALUES('wu1263-test-athlete-alt','wu1263-test-athlete-alt',
    '{"identity":{"kind":"person"},"homie_sync":{"homie_id":6,"retired":true}}') RETURNING id INTO athlete_alt;
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta) VALUES
    (alt,cal,'alias_of','{"evidence":"rollback fixture"}'),
    (athlete_alt,athlete,'alias_of','{"evidence":"rollback fixture"}');
  IF dojo.canonical_tag_id(alt)<>cal OR dojo.canonical_tag_id(athlete_alt)<>athlete THEN
    RAISE EXCEPTION '100 test: valid family/athlete alias failed';
  END IF;
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(%s,%s,''alias_of'')',alt,lulu),'alias|unique');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(%s,%s,''alias_of'')',cal,alt),'chain|cycle');
  PERFORM pg_temp.expect_typed_rejection(format('UPDATE dojo.tags SET meta=''{"identity":{"kind":"group"}}'' WHERE id=%s',alt),'endpoints');
  PERFORM pg_temp.expect_typed_rejection(format('UPDATE dojo.tags SET meta=''{"homie_sync":{"homie_id":221}}'' WHERE id=%s',alt),'owners');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(%s,%s,''member_of'')',alt,lulu),'canonical endpoints');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(%s,%s,''alias_of'')',cal,other_athlete),'chain|canonical|owners');
  PERFORM pg_temp.expect_typed_rejection('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) SELECT s.id,t.id,''alias_of'' FROM dojo.tags s,dojo.tags t WHERE s.slug=''the-lazer'' AND t.slug=''lazer-face''','owners|canonical');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type) VALUES(%s,%s,''alias_of'')',alt,alt),'self');
  INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta) VALUES
    (athlete,lulu,'collected_because_of','{"untouched":true,"reasons":[{"code":"favorite_player","explanation":"He was her favorite player."},{"code":"shared_name","explanation":"Rollback fixture only."}]}'),
    (other_athlete,lulu,'collected_because_of','{"reasons":[{"code":"shared_name","explanation":"Rollback fixture only."}]}');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta) VALUES(%s,%s,''collected_because_of'',''{"reasons":[]}'')',athlete,cal),'reasons');
  PERFORM pg_temp.expect_typed_rejection(format('INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta) VALUES(%s,%s,''collected_because_of'',''{"reasons":[{"code":"shared_name","explanation":"test"}]}'')',athlete,alt),'canonical endpoints');
  PERFORM pg_temp.expect_typed_rejection('UPDATE dojo.homie SET tag_slug=''wu1263-test-renamed'' WHERE id=221','retired athlete');
  PERFORM dojo.assert_typed_tag_relationships();
END;
$behavior$;
ROLLBACK;
