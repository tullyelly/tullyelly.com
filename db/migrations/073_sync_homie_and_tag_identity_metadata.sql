-- 073_sync_homie_and_tag_identity_metadata.sql
-- Keep shared tag identities aligned with CardAttack homies and unambiguous
-- theabbott tag routes.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE FUNCTION dojo.infer_theabbott_tag_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  identity_kind TEXT;
  context_role TEXT;
  identity JSONB;
  contexts JSONB;
  context JSONB;
BEGIN
  IF NEW.href_kind = 'homie'
     AND NEW.href LIKE '/theabbott/homies/%' THEN
    identity_kind := 'person';
    context_role := 'homie';
  ELSIF NEW.href_kind = 'clan'
        AND NEW.href LIKE '/theabbott/clans/%' THEN
    identity_kind := 'group';
    context_role := 'clan';
  ELSE
    RETURN NEW;
  END IF;

  NEW.meta := COALESCE(NEW.meta, '{}'::jsonb);
  identity := COALESCE(NEW.meta->'identity', '{}'::jsonb);
  contexts := COALESCE(identity->'contexts', '{}'::jsonb);
  context := COALESCE(contexts->'theabbott', '{}'::jsonb);

  NEW.meta := NEW.meta || jsonb_build_object(
    'identity',
    identity
      || jsonb_build_object('kind', identity_kind)
      || jsonb_build_object(
        'contexts',
        contexts || jsonb_build_object(
          'theabbott',
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

DROP TRIGGER IF EXISTS trg_infer_theabbott_tag_identity ON dojo.tags;
CREATE TRIGGER trg_infer_theabbott_tag_identity
BEFORE INSERT OR UPDATE OF slug, href, href_kind, meta
ON dojo.tags
FOR EACH ROW
EXECUTE FUNCTION dojo.infer_theabbott_tag_identity();

CREATE OR REPLACE FUNCTION dojo.sync_homie_tag_identity(
  p_tag_slug TEXT,
  p_homie_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_slug TEXT := NULLIF(btrim(p_tag_slug), '');
  normalized_name TEXT := NULLIF(btrim(p_homie_name), '');
  cardattack_href TEXT;
  cardattack_meta JSONB;
BEGIN
  IF normalized_slug IS NULL THEN
    RETURN;
  END IF;

  cardattack_href := '/cardattack/homies/' || normalized_slug;
  cardattack_meta := jsonb_build_object(
    'identity',
    jsonb_build_object(
      'kind', 'person',
      'contexts',
      jsonb_build_object(
        'cardattack',
        jsonb_build_object(
          'role', 'homie',
          'href', cardattack_href
        )
      )
    )
  );

  INSERT INTO dojo.tags (
    slug,
    name,
    display_name,
    href,
    href_kind,
    is_clickable,
    meta
  )
  VALUES (
    normalized_slug,
    normalized_slug,
    lower(COALESCE(normalized_name, normalized_slug)),
    cardattack_href,
    'homie',
    TRUE,
    cardattack_meta
  )
  ON CONFLICT (slug) DO UPDATE
  SET display_name = lower(COALESCE(normalized_name, normalized_slug)),
      href = CASE
        WHEN dojo.tags.href IS NULL OR dojo.tags.href_kind IN ('tag', 'homie')
          THEN EXCLUDED.href
        ELSE dojo.tags.href
      END,
      href_kind = CASE
        WHEN dojo.tags.href IS NULL OR dojo.tags.href_kind IN ('tag', 'homie')
          THEN 'homie'
        ELSE dojo.tags.href_kind
      END,
      is_clickable = TRUE,
      meta = dojo.tags.meta || jsonb_build_object(
        'identity',
        COALESCE(dojo.tags.meta->'identity', '{}'::jsonb)
          || jsonb_build_object('kind', 'person')
          || jsonb_build_object(
            'contexts',
            COALESCE(
              dojo.tags.meta->'identity'->'contexts',
              '{}'::jsonb
            ) || jsonb_build_object(
              'cardattack',
              COALESCE(
                dojo.tags.meta->'identity'->'contexts'->'cardattack',
                '{}'::jsonb
              ) || jsonb_build_object(
                'role', 'homie',
                'href', cardattack_href
              )
            )
          )
      );
END;
$$;

CREATE OR REPLACE FUNCTION dojo.sync_homie_tag_identity_from_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM dojo.sync_homie_tag_identity(NEW.tag_slug, NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_homie_tag_identity ON dojo.homie;
CREATE TRIGGER trg_sync_homie_tag_identity
AFTER INSERT OR UPDATE OF name, tag_slug
ON dojo.homie
FOR EACH ROW
WHEN (NEW.tag_slug IS NOT NULL AND btrim(NEW.tag_slug) <> '')
EXECUTE FUNCTION dojo.sync_homie_tag_identity_from_row();

-- Bring existing homies through the same reusable synchronization function.
DO $$
DECLARE
  homie_row RECORD;
BEGIN
  FOR homie_row IN
    SELECT name, tag_slug
    FROM dojo.homie
    WHERE NULLIF(btrim(tag_slug), '') IS NOT NULL
  LOOP
    PERFORM dojo.sync_homie_tag_identity(
      homie_row.tag_slug,
      homie_row.name
    );
  END LOOP;
END;
$$;

-- Existing unambiguous theabbott routes receive the same metadata that future
-- tag inserts and updates receive from the BEFORE trigger.
UPDATE dojo.tags
SET meta = meta
WHERE (href_kind = 'homie' AND href LIKE '/theabbott/homies/%')
   OR (href_kind = 'clan' AND href LIKE '/theabbott/clans/%');

COMMIT;
