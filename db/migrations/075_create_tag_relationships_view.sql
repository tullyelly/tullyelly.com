-- 075_create_tag_relationships_view.sql
-- Expose direct tag relationships and path-preserving membership traversal.

SET search_path = dojo, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_tag_relationships AS
WITH RECURSIVE
direct_relationships AS (
  SELECT
    selected.id AS tag_id,
    selected.slug AS tag_slug,
    COALESCE(selected.display_name, selected.name, selected.slug) AS tag_display_name,
    related.id AS related_tag_id,
    related.slug AS related_tag_slug,
    COALESCE(related.display_name, related.name, related.slug) AS related_tag_display_name,
    'direct'::TEXT AS relationship_scope,
    'outgoing'::TEXT AS relationship_direction,
    relation.relation_type,
    1 AS depth,
    ARRAY[selected.id, related.id]::INTEGER[] AS path_tag_ids,
    ARRAY[selected.slug, related.slug]::TEXT[] AS path_tag_slugs,
    relation.id AS direct_relation_id,
    relation.source_tag_id AS direct_source_tag_id,
    relation.target_tag_id AS direct_target_tag_id,
    relation.meta AS direct_relation_meta
  FROM dojo.tag_relation AS relation
  JOIN dojo.tags AS selected ON selected.id = relation.source_tag_id
  JOIN dojo.tags AS related ON related.id = relation.target_tag_id

  UNION ALL

  SELECT
    selected.id AS tag_id,
    selected.slug AS tag_slug,
    COALESCE(selected.display_name, selected.name, selected.slug) AS tag_display_name,
    related.id AS related_tag_id,
    related.slug AS related_tag_slug,
    COALESCE(related.display_name, related.name, related.slug) AS related_tag_display_name,
    'direct'::TEXT AS relationship_scope,
    'incoming'::TEXT AS relationship_direction,
    relation.relation_type,
    1 AS depth,
    ARRAY[selected.id, related.id]::INTEGER[] AS path_tag_ids,
    ARRAY[selected.slug, related.slug]::TEXT[] AS path_tag_slugs,
    relation.id AS direct_relation_id,
    relation.source_tag_id AS direct_source_tag_id,
    relation.target_tag_id AS direct_target_tag_id,
    relation.meta AS direct_relation_meta
  FROM dojo.tag_relation AS relation
  JOIN dojo.tags AS selected ON selected.id = relation.target_tag_id
  JOIN dojo.tags AS related ON related.id = relation.source_tag_id
),
membership_paths AS (
  SELECT seed.*
  FROM (
    SELECT source.id AS tag_id, target.id AS related_tag_id,
      'outgoing'::TEXT AS relationship_direction, 1 AS depth,
      ARRAY[source.id, target.id]::INTEGER[] AS path_tag_ids,
      ARRAY[source.slug, target.slug]::TEXT[] AS path_tag_slugs
    FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS source ON source.id = relation.source_tag_id
    JOIN dojo.tags AS target ON target.id = relation.target_tag_id
    WHERE relation.relation_type = 'member_of'

    UNION ALL

    SELECT target.id, source.id, 'incoming'::TEXT, 1,
      ARRAY[target.id, source.id]::INTEGER[],
      ARRAY[target.slug, source.slug]::TEXT[]
    FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS source ON source.id = relation.source_tag_id
    JOIN dojo.tags AS target ON target.id = relation.target_tag_id
    WHERE relation.relation_type = 'member_of'
  ) AS seed

  UNION ALL

  SELECT path.tag_id, next_step.related_tag_id, path.relationship_direction,
    path.depth + 1, path.path_tag_ids || next_step.related_tag_id,
    path.path_tag_slugs || next_step.related_tag_slug
  FROM membership_paths AS path
  CROSS JOIN LATERAL (
    SELECT next_target.id AS related_tag_id, next_target.slug AS related_tag_slug
    FROM dojo.tag_relation AS next_relation
    JOIN dojo.tags AS next_target ON next_target.id = next_relation.target_tag_id
    WHERE path.relationship_direction = 'outgoing'
      AND next_relation.source_tag_id = path.related_tag_id
      AND next_relation.relation_type = 'member_of'
    UNION ALL
    SELECT next_source.id, next_source.slug
    FROM dojo.tag_relation AS next_relation
    JOIN dojo.tags AS next_source ON next_source.id = next_relation.source_tag_id
    WHERE path.relationship_direction = 'incoming'
      AND next_relation.target_tag_id = path.related_tag_id
      AND next_relation.relation_type = 'member_of'
  ) AS next_step
  WHERE NOT next_step.related_tag_id = ANY(path.path_tag_ids)
),
indirect_relationships AS (
  SELECT
    selected.id AS tag_id,
    selected.slug AS tag_slug,
    COALESCE(selected.display_name, selected.name, selected.slug) AS tag_display_name,
    related.id AS related_tag_id,
    related.slug AS related_tag_slug,
    COALESCE(related.display_name, related.name, related.slug) AS related_tag_display_name,
    'indirect'::TEXT AS relationship_scope,
    path.relationship_direction,
    'member_of'::TEXT AS relation_type,
    path.depth,
    path.path_tag_ids,
    path.path_tag_slugs,
    NULL::BIGINT AS direct_relation_id,
    NULL::INTEGER AS direct_source_tag_id,
    NULL::INTEGER AS direct_target_tag_id,
    NULL::JSONB AS direct_relation_meta
  FROM membership_paths AS path
  JOIN dojo.tags AS selected ON selected.id = path.tag_id
  JOIN dojo.tags AS related ON related.id = path.related_tag_id
  WHERE path.depth > 1
    AND path.related_tag_id <> path.tag_id
),
isolated_tags AS (
  SELECT
    tag.id AS tag_id,
    tag.slug AS tag_slug,
    COALESCE(tag.display_name, tag.name, tag.slug) AS tag_display_name,
    NULL::INTEGER AS related_tag_id,
    NULL::TEXT AS related_tag_slug,
    NULL::TEXT AS related_tag_display_name,
    NULL::TEXT AS relationship_scope,
    NULL::TEXT AS relationship_direction,
    NULL::TEXT AS relation_type,
    NULL::INTEGER AS depth,
    NULL::INTEGER[] AS path_tag_ids,
    NULL::TEXT[] AS path_tag_slugs,
    NULL::BIGINT AS direct_relation_id,
    NULL::INTEGER AS direct_source_tag_id,
    NULL::INTEGER AS direct_target_tag_id,
    NULL::JSONB AS direct_relation_meta
  FROM dojo.tags AS tag
  WHERE NOT EXISTS (
    SELECT 1
    FROM dojo.tag_relation AS relation
    WHERE relation.source_tag_id = tag.id
       OR relation.target_tag_id = tag.id
  )
)
SELECT * FROM direct_relationships
UNION ALL
SELECT * FROM indirect_relationships
UNION ALL
SELECT * FROM isolated_tags;

COMMENT ON VIEW dojo.v_tag_relationships IS
  'Tag-centric direct relationships plus every cycle-safe member_of ancestor and descendant path. For member_of, source is the member and target is the containing group.';
COMMENT ON COLUMN dojo.v_tag_relationships.relationship_scope IS
  'direct for stored edges, indirect for member_of paths of depth 2 or greater, and null for isolated tags.';
COMMENT ON COLUMN dojo.v_tag_relationships.relationship_direction IS
  'outgoing follows stored source-to-target edges; incoming follows stored target-to-source edges. For member_of these mean ancestors and descendants, respectively.';
COMMENT ON COLUMN dojo.v_tag_relationships.depth IS
  'Number of relationship edges in the path; direct relationships have depth 1.';
COMMENT ON COLUMN dojo.v_tag_relationships.path_tag_ids IS
  'Ordered tag IDs from the selected tag through the related tag, inclusive.';
COMMENT ON COLUMN dojo.v_tag_relationships.path_tag_slugs IS
  'Ordered tag slugs from the selected tag through the related tag, inclusive.';
COMMENT ON COLUMN dojo.v_tag_relationships.direct_relation_id IS
  'Stored dojo.tag_relation ID for direct rows only; null for indirect and isolated rows.';
COMMENT ON COLUMN dojo.v_tag_relationships.direct_relation_meta IS
  'Stored relationship metadata for direct rows only; null because an indirect path has no single metadata value.';

COMMIT;
