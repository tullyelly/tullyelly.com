-- WU-1263: reference definitions from migration 100.
CREATE OR REPLACE FUNCTION dojo.valid_collection_reasons(p_meta jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE reason jsonb; seen text[] := ARRAY[]::text[];
BEGIN
  IF jsonb_typeof(p_meta) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_meta->'reasons') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(p_meta->'reasons')=0 THEN RETURN false; END IF;
  FOR reason IN SELECT value FROM jsonb_array_elements(p_meta->'reasons') LOOP
    IF jsonb_typeof(reason) IS DISTINCT FROM 'object'
       OR jsonb_typeof(reason->'code') IS DISTINCT FROM 'string'
       OR reason->>'code' NOT IN ('shared_name','favorite_player')
       OR jsonb_typeof(reason->'explanation') IS DISTINCT FROM 'string'
       OR btrim(reason->>'explanation', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')=''
       OR reason->>'code'=ANY(seen) THEN RETURN false; END IF;
    seen := array_append(seen,reason->>'code');
  END LOOP;
  RETURN true;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.canonical_tag_id(p_tag_id integer)
RETURNS integer LANGUAGE sql STABLE AS $fn$
  SELECT coalesce((SELECT target_tag_id FROM dojo.tag_relation
    WHERE source_tag_id=p_tag_id AND relation_type='alias_of'),p_tag_id)
$fn$;

CREATE OR REPLACE FUNCTION dojo.tag_known_owner(p_tag_id integer)
RETURNS text LANGUAGE plpgsql VOLATILE AS $fn$
DECLARE t dojo.tags%ROWTYPE; owners text[]; owner text;
BEGIN
  SELECT * INTO STRICT t FROM dojo.tags WHERE id=p_tag_id;
  SELECT array_agg(DISTINCT v) INTO owners FROM (
    SELECT 'homie:'||h.id AS v FROM dojo.homie h WHERE h.tag_slug=t.slug
    UNION ALL SELECT 'homie:'||(t.meta#>>'{homie_sync,homie_id}') WHERE t.meta#>>'{homie_sync,homie_id}' IS NOT NULL
    UNION ALL SELECT 'homie:'||h.id FROM dojo.homie h
      JOIN (VALUES(t.href),(t.meta#>>'{identity,contexts,cardattack,href}')) routes(href)
        ON routes.href='/cardattack/homies/'||h.tag_slug
    UNION ALL SELECT 'fam:'||substring(href FROM '^/unclejimmy/fam/([^/]+)$')
      FROM (VALUES(t.href),(t.meta#>>'{identity,contexts,unclejimmy,href}')) routes(href)
      WHERE href ~ '^/unclejimmy/fam/[^/]+$'
    UNION ALL SELECT 'fam:'||substring(i.href FROM '^/unclejimmy/fam/([^/]+)$')
      FROM dojo.unclejimmy_squad_item i WHERE i.slug=t.slug AND i.href ~ '^/unclejimmy/fam/[^/]+$'
  ) evidence;
  IF cardinality(owners)>1 THEN RAISE EXCEPTION 'tag % has contradictory known owners %',t.slug,owners; END IF;
  owner := owners[1];
  RETURN owner;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.assert_typed_tag_relationships()
RETURNS void LANGUAGE plpgsql VOLATILE AS $fn$
DECLARE e record; source_owner text; target_owner text;
BEGIN
  FOR e IN SELECT r.*,s.slug AS source_slug,s.meta AS source_meta,t.slug AS target_slug,t.meta AS target_meta
    FROM dojo.tag_relation r JOIN dojo.tags s ON s.id=r.source_tag_id JOIN dojo.tags t ON t.id=r.target_tag_id
    WHERE r.relation_type IN ('alias_of','collected_because_of') ORDER BY r.id
  LOOP
    IF e.source_tag_id=e.target_tag_id THEN RAISE EXCEPTION 'relation %: self-link forbidden',e.id; END IF;
    IF e.relation_type='alias_of' THEN
      IF (e.source_meta#>>'{identity,kind}' IS NOT NULL AND e.source_meta#>>'{identity,kind}'<>'person')
         OR e.target_meta#>>'{identity,kind}' IS DISTINCT FROM 'person'
         OR EXISTS(SELECT 1 FROM dojo.clan WHERE slug IN (e.source_slug,e.target_slug))
         OR EXISTS(SELECT 1 FROM dojo.tags t WHERE t.id IN (e.source_tag_id,e.target_tag_id)
           AND (t.href ~ '^/unclejimmy/squads?/' OR t.meta#>>'{identity,contexts,unclejimmy,role}'='squad'
             OR t.meta#>>'{identity,contexts,unclejimmy,href}' ~ '^/unclejimmy/squads?/'))
         OR EXISTS(SELECT 1 FROM dojo.unclejimmy_squad_item i WHERE i.slug IN (e.source_slug,e.target_slug) AND i.kind IN ('team','placeholder')) THEN
        RAISE EXCEPTION 'alias % (% -> %): endpoints must represent the same person, never a group',e.id,e.source_slug,e.target_slug;
      END IF;
      IF EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE r.relation_type='alias_of' AND r.id<>e.id
        AND (r.source_tag_id=e.source_tag_id OR r.source_tag_id=e.target_tag_id OR r.target_tag_id=e.source_tag_id)) THEN
        RAISE EXCEPTION 'alias %: multiple targets, chain or cycle; use one direct canonical target',e.id;
      END IF;
      IF EXISTS(SELECT 1 FROM dojo.homie WHERE tag_slug=e.source_slug) THEN
        RAISE EXCEPTION 'alias %: source % is an authoritative homie slug; use it as canonical',e.id,e.source_slug;
      END IF;
      source_owner := dojo.tag_known_owner(e.source_tag_id);
      target_owner := dojo.tag_known_owner(e.target_tag_id);
      IF source_owner='fam:'||e.source_slug OR
         (target_owner LIKE 'fam:%' AND target_owner<>'fam:'||e.target_slug) THEN
        RAISE EXCEPTION 'alias %: preserve the canonical family slug/route; alternate names must point to it',e.id;
      END IF;
      IF source_owner IS NOT NULL AND source_owner IS DISTINCT FROM target_owner THEN
        RAISE EXCEPTION 'alias %: different known owners % and %; do not equate % with %',e.id,source_owner,target_owner,e.source_slug,e.target_slug;
      END IF;
      IF (source_owner IS NOT NULL AND source_owner LIKE 'homie:%') OR (target_owner IS NOT NULL AND target_owner LIKE 'homie:%') THEN
        IF dojo.homie_tag_reserved_reason(e.source_tag_id) IS NOT NULL OR dojo.homie_tag_reserved_reason(e.target_tag_id) IS NOT NULL THEN
          RAISE EXCEPTION 'alias %: athlete cannot claim family/squad identity or membership',e.id;
        END IF;
      ELSIF dojo.homie_tag_reserved_reason(e.source_tag_id) IS NOT NULL AND source_owner IS NULL THEN
        RAISE EXCEPTION 'alias %: source has an unresolved family/squad reservation',e.id;
      END IF;
      IF target_owner LIKE 'homie:%' AND NOT EXISTS(SELECT 1 FROM dojo.homie h WHERE 'homie:'||h.id=target_owner AND h.tag_slug=e.target_slug) THEN
        RAISE EXCEPTION 'alias %: target is a retired athlete tag; retarget to current homie.tag_slug',e.id;
      END IF;
    ELSE
      IF NOT dojo.valid_collection_reasons(e.meta) THEN
        RAISE EXCEPTION 'motivation %: meta.reasons needs unique shared_name/favorite_player codes and nonblank explanations',e.id;
      END IF;
      IF e.source_meta#>>'{identity,kind}' IS NULL OR e.source_meta#>>'{identity,kind}' NOT IN ('person','group')
         OR e.target_meta#>>'{identity,kind}' IS DISTINCT FROM 'person' THEN
        RAISE EXCEPTION 'motivation %: source must be a supported collection subject and target a person',e.id;
      END IF;
      IF dojo.canonical_tag_id(e.source_tag_id)<>e.source_tag_id OR dojo.canonical_tag_id(e.target_tag_id)<>e.target_tag_id THEN
        RAISE EXCEPTION 'motivation %: use canonical endpoints % -> %',e.id,dojo.canonical_tag_id(e.source_tag_id),dojo.canonical_tag_id(e.target_tag_id);
      END IF;
      source_owner := dojo.tag_known_owner(e.source_tag_id);
      target_owner := dojo.tag_known_owner(e.target_tag_id);
      IF source_owner IS NOT NULL AND source_owner=target_owner THEN
        RAISE EXCEPTION 'motivation %: endpoints have the same known owner; self-motivation forbidden',e.id;
      END IF;
      IF EXISTS(SELECT 1 FROM dojo.tags t JOIN dojo.homie h ON t.meta#>>'{homie_sync,homie_id}'=h.id::text
        WHERE t.id IN (e.source_tag_id,e.target_tag_id) AND t.slug IS DISTINCT FROM h.tag_slug) THEN
        RAISE EXCEPTION 'motivation %: retired athlete endpoint; retarget to current homie.tag_slug',e.id;
      END IF;
    END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE r.relation_type='member_of'
    AND (dojo.canonical_tag_id(r.source_tag_id)<>r.source_tag_id OR dojo.canonical_tag_id(r.target_tag_id)<>r.target_tag_id)) THEN
    RAISE EXCEPTION 'member_of references an alias; reconcile reviewed memberships to canonical endpoints before adding alias';
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION dojo.check_typed_tag_relationships()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM dojo.assert_typed_tag_relationships();
  RETURN NULL;
END;
$fn$;
