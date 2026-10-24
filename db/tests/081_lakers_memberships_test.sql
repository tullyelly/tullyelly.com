-- Read-only assertions after manually applying migration 081.
BEGIN READ ONLY;

DO $test$
DECLARE
  expected RECORD;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('andrew-bogut'),
      ('ad'),
      ('splash-mountain'),
      ('carmelo-anthony'),
      ('dennis-rodman'),
      ('the-glove'),
      ('joe-smith'),
      ('kareem'),
      ('karl-malone'),
      ('kobe'),
      ('kostas-antetokounmpo'),
      ('lebron-james'),
      ('luka'),
      ('magic'),
      ('mitch-richmond'),
      ('pau-gasol'),
      ('diesel'),
      ('sterling-brown'),
      ('nash'),
      ('wes-matthews')
    ) AS seed(source_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source_tag ON source_tag.id = relation.source_tag_id
      JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
      JOIN dojo.clan AS clan ON clan.slug = target_tag.slug
      WHERE source_tag.slug = expected.source_slug AND clan.slug = 'purple-and-gold'
        AND relation.relation_type = 'member_of'
    ) THEN
      RAISE EXCEPTION 'expected Lakers membership missing for %', expected.source_slug;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
    WHERE relation.meta->>'migration' = '081_add_lakers_player_memberships'
      AND (target_tag.slug <> 'purple-and-gold'
        OR relation.relation_type <> 'member_of'
        OR relation.meta->>'affiliation_scope' IS DISTINCT FROM 'professional'
        OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
        OR NULLIF(relation.meta->>'evidence_url', '') IS NULL)
  ) THEN
    RAISE EXCEPTION 'Lakers membership target or evidence metadata is incorrect';
  END IF;
END;
$test$;

ROLLBACK;
