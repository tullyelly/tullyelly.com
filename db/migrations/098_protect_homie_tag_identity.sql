-- WU-1261: James-operated cleanup and narrowly scoped synchronization protection.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Run this complete migration first. Only after success run 098_record_applied.sql.
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
DO $target_history$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '098: wrong database'; END IF;
  IF to_regclass('dojo.schema_migration') IS NULL THEN RAISE EXCEPTION '098: expected existing migration ledger missing'; END IF;
  LOCK TABLE dojo.schema_migration IN SHARE MODE;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '098%') THEN
    RAISE EXCEPTION '098: existing history; do not replay the migration, inspect read-only';
  END IF;
END;
$target_history$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity', 0));
LOCK TABLE dojo.homie, dojo.tags, dojo.tag_relation, dojo.unclejimmy_squad_item IN SHARE ROW EXCLUSIVE MODE;

-- Guard known identities before any repair; accept only the reviewed legacy/current values.
DO $known$
BEGIN
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
END;
$known$;

CREATE TEMP TABLE wu1261_family_before ON COMMIT DROP AS
SELECT id,slug,name,display_name,href,href_kind,is_clickable,meta FROM dojo.tags WHERE id IN (33,274);
CREATE TEMP TABLE wu1261_family_edges_before ON COMMIT DROP AS
SELECT * FROM dojo.tag_relation WHERE source_tag_id IN (33,274) OR target_tag_id IN (33,274);

-- The old helper is used only for the two guarded row corrections, before the
-- new invariant exists. It never receives either family slug as a destination.
UPDATE dojo.homie SET tag_slug='eldrid' WHERE id=221 AND tag_slug='cal';
UPDATE dojo.homie SET tag_slug='lazer-face' WHERE id=219 AND tag_slug='the-lazer';
UPDATE dojo.tags
SET display_name=CASE slug WHEN 'cal' THEN 'cal' ELSE 'the lazer' END,
    href_kind='squad', meta=meta #- '{identity,contexts,cardattack}'
WHERE slug IN ('cal','the-lazer');
-- Existing route inference adds/retains the UncleJimmy person/fam context.

CREATE OR REPLACE FUNCTION dojo.homie_identity_write_lock()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  -- At READ COMMITTED, each volatile SPI read following this lock sees the
  -- preceding holder's commit. Reject snapshot isolation rather than risk skew.
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'homie identity writes require READ COMMITTED isolation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity', 0));
  RETURN NULL;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.homie_tag_reserved_reason(p_tag_id integer)
RETURNS text LANGUAGE plpgsql VOLATILE AS $fn$
DECLARE reason text;
BEGIN
  WITH RECURSIVE ancestry(id, seen) AS (
    SELECT p_tag_id, ARRAY[p_tag_id]
    UNION ALL
    SELECT r.target_tag_id, a.seen || r.target_tag_id
    FROM ancestry a JOIN dojo.tag_relation r ON r.source_tag_id=a.id AND r.relation_type='member_of'
    WHERE NOT r.target_tag_id=ANY(a.seen)
  )
  SELECT CASE WHEN a.id=p_tag_id THEN 'reserved family/squad identity' ELSE 'membership reaches reserved family/squad identity' END
    || ': ' || t.slug INTO reason
  FROM ancestry a JOIN dojo.tags t ON t.id=a.id
  WHERE t.href LIKE '/unclejimmy/fam/%' OR t.href LIKE '/unclejimmy/squads/%'
     OR t.meta#>>'{identity,contexts,unclejimmy,role}' IN ('fam','squad')
     OR t.meta#>>'{identity,contexts,unclejimmy,href}' LIKE '/unclejimmy/fam/%'
     OR t.meta#>>'{identity,contexts,unclejimmy,href}' LIKE '/unclejimmy/squads/%'
     OR EXISTS (SELECT 1 FROM dojo.unclejimmy_squad_item i WHERE (i.slug=t.slug OR i.href IN ('/unclejimmy/fam/'||t.slug,'/unclejimmy/squads/'||t.slug,'/unclejimmy/squad/'||t.slug))
       AND (i.kind IN ('person','team','placeholder') OR i.href LIKE '/unclejimmy/fam/%' OR i.href LIKE '/unclejimmy/squads/%'))
  ORDER BY cardinality(a.seen),t.id LIMIT 1;
  RETURN reason;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.assert_homie_tag_exclusivity()
RETURNS void LANGUAGE plpgsql VOLATILE AS $fn$
DECLARE conflict record;
BEGIN
  SELECT h.id,h.tag_slug,t.id AS tag_id,dojo.homie_tag_reserved_reason(t.id) AS reason
  INTO conflict FROM dojo.homie h LEFT JOIN dojo.tags t ON t.slug=h.tag_slug
  WHERE h.tag_slug IS NOT NULL AND (t.id IS NULL OR dojo.homie_tag_reserved_reason(t.id) IS NOT NULL)
  ORDER BY h.id LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'homie % cannot claim tag %: %',conflict.id,conflict.tag_slug,coalesce(conflict.reason,'missing synchronized tag');
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.check_homie_tag_exclusivity()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM dojo.assert_homie_tag_exclusivity();
  RETURN NULL;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.sync_homie_tag_identity(p_tag_slug text,p_homie_name text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  h dojo.homie%ROWTYPE;
  t dojo.tags%ROWTYPE;
  expected_href text;
  expected_context jsonb;
  next_meta jsonb;
  next_label text;
  next_href text;
  next_kind text;
  ownership jsonb;
  reason text;
BEGIN
  IF p_tag_slug IS NULL THEN RETURN; END IF;
  SELECT * INTO STRICT h FROM dojo.homie WHERE tag_slug=p_tag_slug;
  IF h.name IS DISTINCT FROM p_homie_name THEN RAISE EXCEPTION 'homie sync requires authoritative current name'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.unclejimmy_squad_item i
    WHERE (i.slug=p_tag_slug OR i.href IN ('/unclejimmy/fam/'||p_tag_slug,'/unclejimmy/squads/'||p_tag_slug,'/unclejimmy/squad/'||p_tag_slug))
      AND (i.kind IN ('person','team','placeholder') OR i.href LIKE '/unclejimmy/fam/%' OR i.href LIKE '/unclejimmy/squads/%')) THEN
    RAISE EXCEPTION 'homie cannot claim tag %: reserved roster identity',p_tag_slug;
  END IF;
  expected_href := '/cardattack/homies/'||p_tag_slug;
  expected_context := jsonb_build_object('role','homie','href',expected_href);
  SELECT * INTO t FROM dojo.tags WHERE slug=p_tag_slug FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO dojo.tags(slug,name,display_name,href,href_kind,is_clickable,meta)
    VALUES(p_tag_slug,p_tag_slug,lower(btrim(h.name)),expected_href,'homie',true,
      jsonb_build_object('identity',jsonb_build_object('kind','person','contexts',jsonb_build_object('cardattack',expected_context)),
        'homie_sync',jsonb_build_object('homie_id',h.id,'href',expected_href,'display_name',lower(btrim(h.name)),'retired',false)));
    RETURN;
  END IF;
  reason := dojo.homie_tag_reserved_reason(t.id);
  IF reason IS NOT NULL THEN RAISE EXCEPTION 'homie cannot claim tag %: %',t.slug,reason; END IF;
  IF (t.meta#>>'{identity,kind}' IS NOT NULL AND t.meta#>>'{identity,kind}'<>'person')
     OR (t.meta#>>'{homie_sync,homie_id}' IS NOT NULL AND t.meta#>>'{homie_sync,homie_id}'<>h.id::text)
     OR (t.meta#>'{identity,contexts,cardattack}' IS NOT NULL AND
       (t.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
        OR t.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM expected_href)) THEN
    RAISE EXCEPTION 'tag % has ambiguous identity ownership',t.slug;
  END IF;
  -- Legacy adoption only proves matching fields, never all metadata/relationships.
  ownership := coalesce(t.meta->'homie_sync','{}'::jsonb);
  next_label := t.display_name;
  IF next_label IS NULL OR next_label=ownership->>'display_name'
     OR (next_label=lower(btrim(h.name)) AND t.href=expected_href AND t.href_kind='homie'
       AND t.meta#>'{identity,contexts}'=jsonb_build_object('cardattack',expected_context)) THEN
    next_label := lower(btrim(h.name));
    ownership := ownership||jsonb_build_object('display_name',next_label);
  ELSE ownership := ownership-'display_name'; END IF;
  next_href := t.href; next_kind := t.href_kind;
  IF (t.href IS NULL AND t.href_kind='tag') OR (t.href=expected_href AND t.href_kind='homie') THEN
    next_href := expected_href; next_kind := 'homie';
    ownership := ownership||jsonb_build_object('href',expected_href);
  ELSE ownership := ownership-'href'; END IF;
  ownership := ownership||jsonb_build_object('homie_id',h.id,'retired',false);
  next_meta := jsonb_set(t.meta,'{identity}',coalesce(t.meta->'identity','{}'::jsonb)||
    jsonb_build_object('kind','person','contexts',coalesce(t.meta#>'{identity,contexts}','{}'::jsonb)||
      jsonb_build_object('cardattack',coalesce(t.meta#>'{identity,contexts,cardattack}','{}'::jsonb)||expected_context)))
    ||jsonb_build_object('homie_sync',ownership);
  UPDATE dojo.tags SET display_name=next_label,href=next_href,href_kind=next_kind,meta=next_meta
  WHERE id=t.id AND (display_name,href,href_kind,meta) IS DISTINCT FROM (next_label,next_href,next_kind,next_meta);
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.retire_homie_tag(p_homie_id bigint,p_slug text,p_old_name text,p_new_slug text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  t dojo.tags%ROWTYPE;
  destination integer;
  edge dojo.tag_relation%ROWTYPE;
  duplicate_id bigint;
  expected_href text := '/cardattack/homies/'||p_slug;
  expected_context jsonb := jsonb_build_object('role','homie','href','/cardattack/homies/'||p_slug);
  proven boolean;
  next_meta jsonb;
  next_href text;
  next_kind text;
BEGIN
  IF pg_trigger_depth()=0 THEN RAISE EXCEPTION 'retirement is internal to homie row synchronization'; END IF;
  IF p_slug IS NULL OR p_slug IS NOT DISTINCT FROM p_new_slug THEN RETURN; END IF;
  SELECT * INTO t FROM dojo.tags WHERE slug=p_slug FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF dojo.homie_tag_reserved_reason(t.id) IS NOT NULL THEN
    RAISE EXCEPTION 'obsolete tag % is reserved; manual ownership review required',p_slug;
  END IF;
  proven := t.meta#>>'{homie_sync,homie_id}'=p_homie_id::text OR
    (t.href=expected_href AND t.href_kind='homie' AND t.meta#>'{identity,contexts}'=jsonb_build_object('cardattack',expected_context));
  IF proven IS NOT TRUE THEN
    RAISE EXCEPTION 'obsolete tag % has ambiguous synchronization ownership; no memberships moved',p_slug;
  END IF;
  IF p_new_slug IS NOT NULL THEN
    SELECT id INTO STRICT destination FROM dojo.tags WHERE slug=p_new_slug;
    FOR edge IN SELECT r.* FROM dojo.tag_relation r JOIN dojo.tags target ON target.id=r.target_tag_id
      WHERE r.source_tag_id=t.id AND r.relation_type='member_of'
        AND EXISTS (SELECT 1 FROM dojo.clan c WHERE c.slug=target.slug)
      ORDER BY r.id FOR UPDATE OF r
    LOOP
      IF edge.meta->>'membership_basis' IS DISTINCT FROM 'played_for' OR nullif(edge.meta->>'evidence_url','') IS NULL THEN
        RAISE EXCEPTION 'tag % clan membership % lacks athlete evidence; review',p_slug,edge.id;
      END IF;
      SELECT id INTO duplicate_id FROM dojo.tag_relation WHERE source_tag_id=destination
        AND target_tag_id=edge.target_tag_id AND relation_type=edge.relation_type FOR UPDATE;
      IF duplicate_id IS NULL THEN
        UPDATE dojo.tag_relation SET source_tag_id=destination WHERE id=edge.id;
      ELSE
        IF EXISTS(SELECT 1 FROM dojo.tag_relation WHERE id=duplicate_id AND meta ? 'homie_sync_merged_edges'
            AND jsonb_typeof(meta->'homie_sync_merged_edges')<>'array') THEN
          RAISE EXCEPTION 'destination edge % has conflicting evidence archive metadata',duplicate_id;
        END IF;
        -- Preserve the complete former edge (including original evidence/audit IDs)
        -- before removing the duplicate source edge. Destination metadata survives.
        UPDATE dojo.tag_relation SET meta=meta||jsonb_build_object('homie_sync_merged_edges',
          coalesce(meta->'homie_sync_merged_edges','[]'::jsonb)||jsonb_build_array(to_jsonb(edge)))
        WHERE id=duplicate_id;
        IF EXISTS(SELECT 1 FROM pg_constraint WHERE contype='f' AND confrelid='dojo.tag_relation'::regclass) THEN
          RAISE EXCEPTION 'tag_relation now has inbound references; review before deduplicating edge %',edge.id;
        END IF;
        DELETE FROM dojo.tag_relation WHERE id=edge.id;
      END IF;
    END LOOP;
  END IF;
  next_meta := t.meta;
  IF next_meta#>>'{identity,contexts,cardattack,role}'='homie'
     AND next_meta#>>'{identity,contexts,cardattack,href}'=expected_href THEN
    next_meta := next_meta #- '{identity,contexts,cardattack,role}' #- '{identity,contexts,cardattack,href}';
    IF next_meta#>'{identity,contexts,cardattack}'='{}'::jsonb THEN next_meta := next_meta #- '{identity,contexts,cardattack}'; END IF;
  END IF;
  next_meta := next_meta||jsonb_build_object('homie_sync',jsonb_build_object('homie_id',p_homie_id,'retired',true));
  next_href := t.href; next_kind := t.href_kind;
  IF t.href=expected_href AND t.href_kind='homie' THEN next_href := NULL; next_kind := 'tag'; END IF;
  UPDATE dojo.tags SET href=next_href,href_kind=next_kind,meta=next_meta
  WHERE id=t.id AND (href,href_kind,meta) IS DISTINCT FROM (next_href,next_kind,next_meta);
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.sync_homie_tag_identity_from_row()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE retired record;
BEGIN
  IF TG_OP='UPDATE' AND (OLD.name,OLD.tag_slug) IS NOT DISTINCT FROM (NEW.name,NEW.tag_slug) THEN RETURN NEW; END IF;
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
  RETURN NEW;
END;
$fn$;

DROP TRIGGER trg_sync_homie_tag_identity ON dojo.homie;
CREATE TRIGGER trg_sync_homie_tag_identity AFTER INSERT OR UPDATE OF name,tag_slug ON dojo.homie
FOR EACH ROW EXECUTE FUNCTION dojo.sync_homie_tag_identity_from_row();

-- Only the two reviewed current athletes receive initial managed-field ownership.
SELECT dojo.sync_homie_tag_identity(tag_slug,name) FROM dojo.homie WHERE id IN (219,221);
SELECT dojo.assert_homie_tag_exclusivity();

-- Serialize before row locks on every relevant write path, including reverse
-- tag/context, roster and multi-hop membership edits. Inference/audit remain active.
DO $triggers$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['homie','tags','tag_relation','unclejimmy_squad_item'] LOOP
    EXECUTE format('CREATE TRIGGER trg_00_homie_identity_lock BEFORE INSERT OR UPDATE OR DELETE ON dojo.%I FOR EACH STATEMENT EXECUTE FUNCTION dojo.homie_identity_write_lock()',target);
    EXECUTE format('CREATE TRIGGER trg_zz_homie_identity_check AFTER INSERT OR UPDATE OR DELETE ON dojo.%I FOR EACH STATEMENT EXECUTE FUNCTION dojo.check_homie_tag_exclusivity()',target);
  END LOOP;
END;
$triggers$;
-- Necessary effect assertions remain inside the canonical transaction.
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
DO $preserve$
BEGIN
  IF EXISTS (SELECT 1 FROM wu1261_family_before b JOIN dojo.tags t USING(id)
      WHERE (t.slug,t.name,t.href,t.is_clickable) IS DISTINCT FROM (b.slug,b.name,b.href,b.is_clickable)
        OR (t.meta #- '{identity}') IS DISTINCT FROM (b.meta #- '{identity}')
        OR (t.meta#>'{identity}' - 'kind' - 'contexts') IS DISTINCT FROM (b.meta#>'{identity}' - 'kind' - 'contexts')
        OR (coalesce(t.meta#>'{identity,contexts,unclejimmy}','{}'::jsonb) - 'role' - 'href') IS DISTINCT FROM
           (coalesce(b.meta#>'{identity,contexts,unclejimmy}','{}'::jsonb) - 'role' - 'href')
        OR (t.meta#>'{identity,contexts}' - 'cardattack' - 'unclejimmy') IS DISTINCT FROM
           (b.meta#>'{identity,contexts}' - 'cardattack' - 'unclejimmy')) THEN
    RAISE EXCEPTION '098: unrelated family state changed';
  END IF;
  IF EXISTS ((SELECT * FROM wu1261_family_edges_before EXCEPT SELECT * FROM dojo.tag_relation)
      UNION ALL (SELECT * FROM dojo.tag_relation WHERE source_tag_id IN (33,274) OR target_tag_id IN (33,274)
        EXCEPT SELECT * FROM wu1261_family_edges_before)) THEN
    RAISE EXCEPTION '098: family relationship evidence changed';
  END IF;
END;
$preserve$;
COMMIT;
