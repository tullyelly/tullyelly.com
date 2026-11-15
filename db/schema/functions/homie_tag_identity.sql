-- Current definitions prepared in migration 098; review-only schema reference.
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
