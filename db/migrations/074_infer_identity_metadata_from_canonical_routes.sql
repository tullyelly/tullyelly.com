-- 074_infer_identity_metadata_from_canonical_routes.sql
-- Keep shared identity metadata aligned with every unambiguous canonical
-- Homie, Clan, Fam, and Squad tag route.

SET search_path = dojo, auth, public;

BEGIN;

DROP TRIGGER IF EXISTS trg_infer_theabbott_tag_identity ON dojo.tags;

CREATE OR REPLACE FUNCTION dojo.infer_tag_identity_from_canonical_route()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  identity_kind TEXT;
  identity_context TEXT;
  context_role TEXT;
  identity JSONB;
  contexts JSONB;
  context JSONB;
BEGIN
  IF NEW.href_kind = 'homie'
     AND NEW.href LIKE '/cardattack/homies/%' THEN
    identity_kind := 'person';
    identity_context := 'cardattack';
    context_role := 'homie';
  ELSIF NEW.href_kind = 'clan'
        AND NEW.href LIKE '/cardattack/clans/%' THEN
    identity_kind := 'group';
    identity_context := 'cardattack';
    context_role := 'clan';
  ELSIF NEW.href_kind = 'homie'
        AND NEW.href LIKE '/theabbott/homies/%' THEN
    identity_kind := 'person';
    identity_context := 'theabbott';
    context_role := 'homie';
  ELSIF NEW.href_kind = 'clan'
        AND NEW.href LIKE '/theabbott/clans/%' THEN
    identity_kind := 'group';
    identity_context := 'theabbott';
    context_role := 'clan';
  ELSIF NEW.href_kind = 'squad'
        AND NEW.href LIKE '/unclejimmy/fam/%' THEN
    identity_kind := 'person';
    identity_context := 'unclejimmy';
    context_role := 'fam';
  ELSIF NEW.href_kind = 'squad'
        AND NEW.href LIKE '/unclejimmy/squads/%' THEN
    identity_kind := 'group';
    identity_context := 'unclejimmy';
    context_role := 'squad';
  ELSE
    RETURN NEW;
  END IF;

  NEW.meta := COALESCE(NEW.meta, '{}'::jsonb);
  identity := COALESCE(NEW.meta->'identity', '{}'::jsonb);
  contexts := COALESCE(identity->'contexts', '{}'::jsonb);
  context := COALESCE(contexts->identity_context, '{}'::jsonb);

  NEW.meta := NEW.meta || jsonb_build_object(
    'identity',
    identity
      || jsonb_build_object('kind', identity_kind)
      || jsonb_build_object(
        'contexts',
        contexts || jsonb_build_object(
          identity_context,
          context || jsonb_build_object(
            'role', context_role,
            'href', NEW.href
          )
        )
      )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_infer_tag_identity_from_canonical_route
BEFORE INSERT OR UPDATE OF slug, href, href_kind, meta
ON dojo.tags
FOR EACH ROW
EXECUTE FUNCTION dojo.infer_tag_identity_from_canonical_route();

-- Re-run existing unambiguous canonical routes through the same trigger.
-- The singular legacy /unclejimmy/squad/* namespace is intentionally omitted
-- because it contains people, teams, trackers, and volleyball pages.
UPDATE dojo.tags
SET meta = meta
WHERE (href_kind = 'homie' AND href LIKE '/cardattack/homies/%')
   OR (href_kind = 'clan' AND href LIKE '/cardattack/clans/%')
   OR (href_kind = 'homie' AND href LIKE '/theabbott/homies/%')
   OR (href_kind = 'clan' AND href LIKE '/theabbott/clans/%')
   OR (href_kind = 'squad' AND href LIKE '/unclejimmy/fam/%')
   OR (href_kind = 'squad' AND href LIKE '/unclejimmy/squads/%');

DROP FUNCTION IF EXISTS dojo.infer_theabbott_tag_identity();

COMMIT;
