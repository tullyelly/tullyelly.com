CREATE TABLE dojo.tag_relation (
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

CREATE INDEX tag_relation_source_lookup_idx
  ON dojo.tag_relation (source_tag_id, relation_type, target_tag_id);
CREATE INDEX tag_relation_target_lookup_idx
  ON dojo.tag_relation (target_tag_id, relation_type, source_tag_id);

CREATE TRIGGER trg_audit_tag_relation
BEFORE INSERT OR UPDATE ON dojo.tag_relation
FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();

-- Migration 100; requires functions in functions/typed_tag_relationships.sql.
CREATE UNIQUE INDEX tag_relation_one_alias_target_idx
  ON dojo.tag_relation(source_tag_id) WHERE relation_type='alias_of';
ALTER TABLE dojo.tag_relation ADD CONSTRAINT tag_relation_reasons_check
  CHECK (relation_type<>'collected_because_of' OR dojo.valid_collection_reasons(meta));
-- Statement guards on homie/tags/tag_relation/unclejimmy_squad_item/clan share
-- 098's READ COMMITTED advisory write lock; see migration 100 for installation.
