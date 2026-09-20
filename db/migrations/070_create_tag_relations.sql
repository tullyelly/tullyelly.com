-- 070_create_tag_relations.sql
-- Add generic identity relationships and context-aware identity metadata.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.tag_relation (
  id BIGSERIAL PRIMARY KEY,
  source_tag_id INTEGER NOT NULL REFERENCES dojo.tags(id) ON DELETE CASCADE,
  target_tag_id INTEGER NOT NULL REFERENCES dojo.tags(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT tag_relation_source_type_target_key
    UNIQUE (source_tag_id, relation_type, target_tag_id),
  CONSTRAINT tag_relation_type_check CHECK (btrim(relation_type) <> ''),
  CONSTRAINT tag_relation_no_self_check CHECK (source_tag_id <> target_tag_id),
  CONSTRAINT tag_relation_meta_object_check CHECK (jsonb_typeof(meta) = 'object')
);

COMMENT ON TABLE dojo.tag_relation IS
  'Directed relationships between generic identities in dojo.tags.';
COMMENT ON COLUMN dojo.tag_relation.relation_type IS
  'Extensible relationship name such as member_of; kept as text to avoid schema changes for new relationship types.';
COMMENT ON COLUMN dojo.tag_relation.meta IS
  'Relationship-specific metadata; must be a JSON object.';

CREATE INDEX IF NOT EXISTS tag_relation_source_lookup_idx
  ON dojo.tag_relation (source_tag_id, relation_type, target_tag_id);
CREATE INDEX IF NOT EXISTS tag_relation_target_lookup_idx
  ON dojo.tag_relation (target_tag_id, relation_type, source_tag_id);

DROP TRIGGER IF EXISTS trg_audit_tag_relation ON dojo.tag_relation;
CREATE TRIGGER trg_audit_tag_relation
BEFORE INSERT OR UPDATE ON dojo.tag_relation
FOR EACH ROW EXECUTE FUNCTION dojo.audit_stamp_generic();

-- Merge one identity kind and one alter-ego context without replacing any
-- unrelated tag metadata or other identity contexts.
UPDATE dojo.tags AS tag
SET meta = tag.meta || jsonb_build_object(
  'identity',
  COALESCE(tag.meta->'identity', '{}'::jsonb)
    || jsonb_build_object('kind', 'person')
    || jsonb_build_object(
      'contexts',
      COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)
        || jsonb_build_object(
          'cardattack',
          COALESCE(tag.meta->'identity'->'contexts'->'cardattack', '{}'::jsonb)
            || jsonb_build_object(
              'role', 'homie',
              'href', '/cardattack/homies/' || tag.slug
            )
        )
    )
)
FROM dojo.homie AS homie
WHERE NULLIF(btrim(homie.tag_slug), '') = tag.slug;

UPDATE dojo.tags AS tag
SET meta = tag.meta || jsonb_build_object(
  'identity',
  COALESCE(tag.meta->'identity', '{}'::jsonb)
    || jsonb_build_object('kind', 'group')
    || jsonb_build_object(
      'contexts',
      COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)
        || jsonb_build_object(
          'cardattack',
          COALESCE(tag.meta->'identity'->'contexts'->'cardattack', '{}'::jsonb)
            || jsonb_build_object(
              'role', 'clan',
              'href', '/cardattack/clans/' || tag.slug
            )
        )
    )
)
FROM dojo.clan AS clan
WHERE NULLIF(btrim(clan.tag_slug), '') = tag.slug;

-- Only person and team squad items represent identities. Links and
-- placeholders intentionally do not participate in this backfill.
UPDATE dojo.tags AS tag
SET meta = tag.meta || jsonb_build_object(
  'identity',
  COALESCE(tag.meta->'identity', '{}'::jsonb)
    || jsonb_build_object(
      'kind', CASE item.kind WHEN 'person' THEN 'person' ELSE 'group' END
    )
    || jsonb_build_object(
      'contexts',
      COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)
        || jsonb_build_object(
          'unclejimmy',
          COALESCE(tag.meta->'identity'->'contexts'->'unclejimmy', '{}'::jsonb)
            || jsonb_build_object(
              'role', CASE item.kind WHEN 'person' THEN 'fam' ELSE 'squad' END,
              'href', CASE
                WHEN NULLIF(btrim(item.href), '') LIKE '/unclejimmy/squad/%'
                  THEN btrim(item.href)
                ELSE '/unclejimmy/squad/' || tag.slug
              END
            )
        )
    )
)
FROM dojo.unclejimmy_squad_item AS item
WHERE item.slug = tag.slug
  AND item.kind IN ('person', 'team');

-- Older squad routes are useful context, but do not establish whether an
-- otherwise unmatched identity is a person or group.
UPDATE dojo.tags AS tag
SET meta = tag.meta || jsonb_build_object(
  'identity',
  COALESCE(tag.meta->'identity', '{}'::jsonb)
    || jsonb_build_object(
      'contexts',
      COALESCE(tag.meta->'identity'->'contexts', '{}'::jsonb)
        || jsonb_build_object(
          'unclejimmy',
          COALESCE(tag.meta->'identity'->'contexts'->'unclejimmy', '{}'::jsonb)
            || jsonb_build_object('href', tag.href)
        )
    )
)
WHERE tag.href_kind = 'squad'
  AND tag.href LIKE '/unclejimmy/squad/%';

COMMIT;
