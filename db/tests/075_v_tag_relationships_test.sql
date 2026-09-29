-- Run after migration 075 against a non-production database.
-- All fixture changes are rolled back.
BEGIN;

INSERT INTO dojo.tags (name, slug, display_name)
VALUES
  ('View Test Person', '__view_test_person', 'View Test Person'),
  ('View Test Team A', '__view_test_team_a', 'View Test Team A'),
  ('View Test Team B', '__view_test_team_b', 'View Test Team B'),
  ('View Test Org', '__view_test_org', 'View Test Org'),
  ('View Test Root', '__view_test_root', 'View Test Root'),
  ('View Test Isolated', '__view_test_isolated', 'View Test Isolated')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source.id, target.id, fixture.relation_type, fixture.meta
FROM (
  VALUES
    ('__view_test_person', '__view_test_team_a', 'member_of', '{"branch":"a"}'::jsonb),
    ('__view_test_person', '__view_test_team_b', 'member_of', '{"branch":"b"}'::jsonb),
    ('__view_test_team_a', '__view_test_org', 'member_of', '{}'::jsonb),
    ('__view_test_team_b', '__view_test_org', 'member_of', '{}'::jsonb),
    ('__view_test_org', '__view_test_root', 'member_of', '{}'::jsonb),
    ('__view_test_root', '__view_test_team_a', 'member_of', '{"cycle":true}'::jsonb),
    ('__view_test_person', '__view_test_org', 'follows', '{"since":2026}'::jsonb)
) AS fixture(source_slug, target_slug, relation_type, meta)
JOIN dojo.tags AS source ON source.slug = fixture.source_slug
JOIN dojo.tags AS target ON target.slug = fixture.target_slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $test$
DECLARE
  actual INTEGER;
BEGIN
  -- incoming and outgoing direct relationships
  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_person' AND relationship_scope = 'direct'
    AND relationship_direction = 'outgoing';
  IF actual <> 3 THEN RAISE EXCEPTION 'expected 3 outgoing direct rows, got %', actual; END IF;

  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_org' AND relationship_scope = 'direct'
    AND relationship_direction = 'incoming';
  IF actual <> 3 THEN RAISE EXCEPTION 'expected 3 incoming direct rows, got %', actual; END IF;

  -- multiple relationship types
  SELECT count(DISTINCT relation_type) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_person' AND relationship_scope = 'direct';
  IF actual <> 2 THEN RAISE EXCEPTION 'expected 2 direct relationship types, got %', actual; END IF;

  -- nested membership ancestors and descendants
  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_person' AND related_tag_slug = '__view_test_root'
    AND relation_type = 'member_of' AND relationship_direction = 'outgoing'
    AND relationship_scope = 'indirect' AND depth = 3;
  IF actual <> 2 THEN RAISE EXCEPTION 'expected 2 root ancestor paths, got %', actual; END IF;

  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_root' AND related_tag_slug = '__view_test_person'
    AND relation_type = 'member_of' AND relationship_direction = 'incoming'
    AND relationship_scope = 'indirect' AND depth = 3;
  IF actual <> 2 THEN RAISE EXCEPTION 'expected 2 person descendant paths, got %', actual; END IF;

  -- multiple distinct membership paths
  SELECT count(DISTINCT path_tag_slugs) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_person' AND related_tag_slug = '__view_test_org'
    AND relationship_scope = 'indirect' AND depth = 2;
  IF actual <> 2 THEN RAISE EXCEPTION 'expected 2 distinct org paths, got %', actual; END IF;

  -- cycles remain finite
  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug LIKE '__view_test_%' AND tag_id = related_tag_id;
  IF actual <> 0 THEN RAISE EXCEPTION 'selected tag appeared as its own related tag'; END IF;

  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_person' AND cardinality(path_tag_ids) <> depth + 1;
  IF actual <> 0 THEN RAISE EXCEPTION 'path contains repeated or incorrectly counted tags'; END IF;

  -- isolated tags
  SELECT count(*) INTO actual FROM dojo.v_tag_relationships
  WHERE tag_slug = '__view_test_isolated' AND related_tag_id IS NULL
    AND relationship_scope IS NULL AND depth IS NULL;
  IF actual <> 1 THEN RAISE EXCEPTION 'expected one isolated-tag row, got %', actual; END IF;
END
$test$;

ROLLBACK;
