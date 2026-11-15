-- WU-1264: preserve proven same-athlete references through direct slug changes.
-- James executes development first. After success run 101_record_applied.sql.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
LOCK TABLE dojo.homie,dojo.tags,dojo.tag_relation,dojo.unclejimmy_squad_item,dojo.clan IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.schema_migration IN SHARE MODE;
DO $prerequisites$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '101: wrong database'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '101%') THEN RAISE EXCEPTION '101: history exists; do not replay'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='100_validate_typed_tag_relationships.sql'
    AND checksum='717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31'
    AND status='applied' AND checksum_algorithm='sha256' AND applied_at IS NOT NULL AND error_message IS NULL) THEN
    RAISE EXCEPTION '101: expected recorded 100 prerequisite'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='dojo.sync_homie_tag_identity_from_row()'::regprocedure
    AND md5(replace(prosrc,E'\r\n',E'\n'))='2e89e490bfccbff959f5904a0bfe2eae') THEN
    RAISE EXCEPTION '101: synchronization changed; review installed definition'; END IF;
  IF to_regprocedure('dojo.prepare_homie_alias_rename()') IS NOT NULL THEN
    RAISE EXCEPTION '101: unexpected existing rename helper; inspect instead of replacing'; END IF;
  IF EXISTS(SELECT 1 FROM (VALUES
    ('sync_homie_tag_identity','7aee15861f451f69524c206d17ff4767'),
    ('retire_homie_tag','2cfe6ec1f81e0787c4ff1535e6cea255'),
    ('homie_identity_write_lock','f43f82285630975f2a1b6b71f6ff6a21'),
    ('assert_typed_tag_relationships','b2420bcbf363f839a2b2fa6284c5223c'),
    ('tag_known_owner','50a36699b09edd5e050658df6f4bdcf1'),
    ('canonical_tag_id','4417c7f748647547809d87c67411e1cc')) e(name,hash)
    LEFT JOIN pg_proc p ON p.pronamespace='dojo'::regnamespace AND p.proname=e.name
    WHERE p.oid IS NULL OR md5(replace(p.prosrc,E'\r\n',E'\n'))<>e.hash) THEN
    RAISE EXCEPTION '101: prerequisite function definition changed; review'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_00_homie_identity_lock' AND tgfoid='dojo.homie_identity_write_lock()'::regprocedure
    AND tgtype=30 AND tgenabled='O')<>5 OR
    (SELECT count(*) FROM pg_trigger WHERE tgrelid IN ('dojo.homie'::regclass,'dojo.tags'::regclass,
    'dojo.tag_relation'::regclass,'dojo.unclejimmy_squad_item'::regclass,'dojo.clan'::regclass)
    AND tgname='trg_zy_typed_relationship_check' AND tgfoid='dojo.check_typed_tag_relationships()'::regprocedure
    AND tgtype=28 AND tgenabled='O')<>5 THEN
    RAISE EXCEPTION '101: shared locks or typed statement checks missing/disabled'; END IF;
  IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='dojo.tag_relation'::regclass AND attnum>0 AND NOT attisdropped
    AND attname NOT IN ('id','source_tag_id','target_tag_id','relation_type','meta','created_at','created_by','updated_at','updated_by')) THEN
    RAISE EXCEPTION '101: relation row shape changed; review preservation before retargeting'; END IF;
  PERFORM dojo.assert_homie_tag_exclusivity();
  PERFORM dojo.assert_typed_tag_relationships();
END;
$prerequisites$;
CREATE TEMP TABLE wu1264_tags_before ON COMMIT DROP AS SELECT * FROM dojo.tags;
CREATE TEMP TABLE wu1264_edges_before ON COMMIT DROP AS SELECT * FROM dojo.tag_relation;
CREATE OR REPLACE FUNCTION dojo.prepare_homie_alias_rename()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE old_tag integer; destination dojo.tags%ROWTYPE; owner text;
BEGIN
  IF OLD.tag_slug IS NOT DISTINCT FROM NEW.tag_slug THEN RETURN NEW; END IF;
  SELECT id INTO old_tag FROM dojo.tags WHERE slug=OLD.tag_slug;
  IF NEW.tag_slug IS NULL THEN
    IF EXISTS(SELECT 1 FROM dojo.tag_relation WHERE
      (relation_type='alias_of' AND target_tag_id=old_tag) OR
      (relation_type='collected_because_of' AND old_tag IN (source_tag_id,target_tag_id))) THEN
      RAISE EXCEPTION 'homie rename: null slug would strand aliases/motivations; resolve references first';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO destination FROM dojo.tags WHERE slug=NEW.tag_slug;
  IF FOUND THEN
    owner := dojo.tag_known_owner(destination.id);
    IF dojo.homie_tag_reserved_reason(destination.id) IS NOT NULL OR
       (owner IS NOT NULL AND owner<>'homie:'||NEW.id) THEN
      RAISE EXCEPTION 'homie rename: destination % belongs to another/reserved identity',NEW.tag_slug;
    END IF;
    IF owner IS NULL AND EXISTS(SELECT 1 FROM dojo.tag_relation WHERE relation_type IN ('alias_of','collected_because_of')
      AND destination.id IN (source_tag_id,target_tag_id)) THEN
      RAISE EXCEPTION 'homie rename: unowned destination % has reviewed identity references; review before claiming',NEW.tag_slug;
    END IF;
  ELSE
    -- No route/owner claim until the authoritative homie row changes. 098's
    -- after-row helper will establish managed metadata and preserve authored fields.
    INSERT INTO dojo.tags(slug,name) VALUES(NEW.tag_slug,NEW.tag_slug);
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.sync_homie_tag_identity_from_row()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE retired record; old_tag integer; new_tag integer; saved jsonb := '[]'::jsonb; retired_aliases jsonb := '[]'::jsonb; item jsonb; edge_meta jsonb; edge dojo.tag_relation%ROWTYPE;
BEGIN
  IF TG_OP='UPDATE' AND (OLD.name,OLD.tag_slug) IS NOT DISTINCT FROM (NEW.name,NEW.tag_slug) THEN RETURN NEW; END IF;
  -- The BEFORE trigger has created/validated an unclaimed destination tag while
  -- OLD is still authoritative. Detach references before 098 performs sync/retire.
  IF TG_OP='UPDATE' AND OLD.tag_slug IS DISTINCT FROM NEW.tag_slug AND OLD.tag_slug IS NOT NULL THEN
    SELECT id INTO STRICT old_tag FROM dojo.tags WHERE slug=OLD.tag_slug;
    IF EXISTS(SELECT 1 FROM pg_constraint WHERE contype='f' AND confrelid='dojo.tag_relation'::regclass) THEN
      RAISE EXCEPTION 'homie retarget: relation has inbound references; review before detaching';
    END IF;
    WITH removed AS (
      DELETE FROM dojo.tag_relation WHERE
        (relation_type='alias_of' AND target_tag_id=old_tag) OR
        (relation_type='collected_because_of' AND old_tag IN (source_tag_id,target_tag_id))
      RETURNING *
    ) SELECT coalesce(jsonb_agg(to_jsonb(removed) ORDER BY id),'[]'::jsonb) INTO saved FROM removed;
  END IF;
  -- Destination is checked before any tag upsert, including indirect reservations.
  IF EXISTS (SELECT 1 FROM dojo.tags t WHERE t.slug=NEW.tag_slug AND dojo.homie_tag_reserved_reason(t.id) IS NOT NULL) THEN
    RAISE EXCEPTION 'homie cannot claim reserved tag %: %',NEW.tag_slug,
      (SELECT dojo.homie_tag_reserved_reason(id) FROM dojo.tags WHERE slug=NEW.tag_slug);
  END IF;
  -- Adopt only the previously generated legacy label, with exact pure-route
  -- evidence from OLD; an authored label or mixed context is never marked owned.
  IF TG_OP='UPDATE' AND OLD.tag_slug IS NOT NULL AND OLD.tag_slug=NEW.tag_slug THEN
    UPDATE dojo.tags SET meta=meta||jsonb_build_object('homie_sync',
      jsonb_build_object('homie_id',NEW.id,'display_name',display_name,'href',href,'retired',false))
    WHERE slug=OLD.tag_slug AND NOT meta ? 'homie_sync' AND display_name=lower(btrim(OLD.name))
      AND href='/cardattack/homies/'||OLD.tag_slug AND href_kind='homie'
      AND meta#>'{identity,contexts}'=jsonb_build_object('cardattack',jsonb_build_object('role','homie','href',href));
  END IF;
  PERFORM dojo.sync_homie_tag_identity(NEW.tag_slug,NEW.name);
  IF TG_OP='UPDATE' AND OLD.tag_slug IS DISTINCT FROM NEW.tag_slug THEN
    PERFORM dojo.retire_homie_tag(NEW.id,OLD.tag_slug,OLD.name,NEW.tag_slug);
  END IF;
  IF NEW.tag_slug IS NOT NULL THEN
    FOR retired IN SELECT slug FROM dojo.tags WHERE meta#>>'{homie_sync,homie_id}'=NEW.id::text
      AND meta#>>'{homie_sync,retired}'='true' AND slug<>NEW.tag_slug ORDER BY id
    LOOP
      PERFORM dojo.retire_homie_tag(NEW.id,retired.slug,NEW.name,NEW.tag_slug);
    END LOOP;
  END IF;
  IF old_tag IS NOT NULL AND NEW.tag_slug IS NOT NULL THEN
    SELECT id INTO STRICT new_tag FROM dojo.tags WHERE slug=NEW.tag_slug;
    FOR item IN SELECT value FROM jsonb_array_elements(saved) LOOP
      edge := jsonb_populate_record(NULL::dojo.tag_relation,item);
      -- Returning to a former alias makes that tag canonical; do not restore its self-alias.
      IF edge.relation_type='alias_of' AND edge.source_tag_id=new_tag THEN
        retired_aliases := retired_aliases||jsonb_build_array(item);
        CONTINUE;
      END IF;
      IF edge.meta ? 'homie_alias_retarget_history' AND jsonb_typeof(edge.meta->'homie_alias_retarget_history')<>'array' THEN
        RAISE EXCEPTION 'homie retarget: edge % has conflicting audit archive',edge.id;
      END IF;
      edge_meta := edge.meta||jsonb_build_object('homie_alias_retarget_history',
        coalesce(edge.meta->'homie_alias_retarget_history','[]'::jsonb)||jsonb_build_array(
          item||jsonb_build_object('meta',edge.meta-'homie_alias_retarget_history')));
      INSERT INTO dojo.tag_relation(id,source_tag_id,target_tag_id,relation_type,meta,created_at,created_by)
      VALUES(edge.id,CASE WHEN edge.source_tag_id=old_tag THEN new_tag ELSE edge.source_tag_id END,
        CASE WHEN edge.target_tag_id=old_tag THEN new_tag ELSE edge.target_tag_id END,
        edge.relation_type,edge_meta,edge.created_at,edge.created_by);
      -- Preserve original audit values in the archive, stamp this retarget as an update.
      UPDATE dojo.tag_relation SET meta=meta WHERE id=edge.id;
    END LOOP;
    -- Proven old athlete ownership was required by 098.retire_homie_tag. The
    -- retained tag now resolves directly to NEW; no guessed historical backfill.
    INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
    VALUES(old_tag,new_tag,'alias_of',jsonb_build_object('homie_id',NEW.id,'evidence','authoritative homie slug change','managed_by','homie_sync','homie_alias_retarget_history',retired_aliases));
    PERFORM dojo.assert_typed_tag_relationships();
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_01_prepare_homie_alias_rename BEFORE UPDATE OF tag_slug ON dojo.homie
FOR EACH ROW EXECUTE FUNCTION dojo.prepare_homie_alias_rename();
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
DO $preservation$
BEGIN
  IF EXISTS((SELECT * FROM wu1264_tags_before EXCEPT SELECT * FROM dojo.tags)
    UNION ALL (SELECT * FROM dojo.tags EXCEPT SELECT * FROM wu1264_tags_before)) OR
    EXISTS((SELECT * FROM wu1264_edges_before EXCEPT SELECT * FROM dojo.tag_relation)
    UNION ALL (SELECT * FROM dojo.tag_relation EXCEPT SELECT * FROM wu1264_edges_before)) THEN
    RAISE EXCEPTION '101: existing tags or relations unexpectedly changed'; END IF;
END;
$preservation$;
COMMIT;
