-- Read-only assertions after manually applying migration 089.
BEGIN READ ONLY;

DO $test$
DECLARE
  expected RECORD;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('alvin-robertson'),
      ('chris-bosh'),
      ('dj'),
      ('dell'),
      ('the-dream'),
      ('jalen-rose'),
      ('nwora'),
      ('kwhhyyy'),
      ('lindsey'),
      ('pops-junior'),
      ('barnes'),
      ('shawn-respert'),
      ('t-j-ford'),
      ('terence'),
      ('t-mac'),
      ('vince-carter')
    ) AS seed(source_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source_tag ON source_tag.id = relation.source_tag_id
      JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
      JOIN dojo.clan AS clan ON clan.slug = target_tag.slug
      WHERE source_tag.slug = expected.source_slug AND clan.slug = 'raptors'
        AND relation.relation_type = 'member_of'
    ) THEN
      RAISE EXCEPTION 'expected Raptors membership missing for %', expected.source_slug;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
    WHERE relation.meta->>'migration' = '089_add_raptors_player_memberships'
      AND (target_tag.slug <> 'raptors'
        OR relation.relation_type <> 'member_of'
        OR relation.meta->>'affiliation_scope' IS DISTINCT FROM 'professional'
        OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
        OR NULLIF(relation.meta->>'evidence_url', '') IS NULL)
  ) THEN
    RAISE EXCEPTION 'Raptors membership target or evidence metadata is incorrect';
  END IF;
END;
$test$;

ROLLBACK;
