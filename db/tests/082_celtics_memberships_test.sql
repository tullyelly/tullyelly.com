-- Read-only assertions after manually applying migration 082.
BEGIN READ ONLY;

DO $test$
DECLARE
  expected RECORD;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('blue'),
      ('dominique-wilkins'),
      ('the-glove'),
      ('jabari'),
      ('jason-terry'),
      ('big-deuce'),
      ('jeff'),
      ('jrue'),
      ('justin-jackson'),
      ('the-big-ticket'),
      ('larry-bird'),
      ('malcolm-brogdon'),
      ('marty-conlon'),
      ('fin-dawg'),
      ('jesus'),
      ('robert-parish'),
      ('alien'),
      ('diesel'),
      ('sherminator'),
      ('tiny-archibald'),
      ('day'),
      ('vin')
    ) AS seed(source_slug)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM dojo.tag_relation AS relation
      JOIN dojo.tags AS source_tag ON source_tag.id = relation.source_tag_id
      JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
      JOIN dojo.clan AS clan ON clan.slug = target_tag.slug
      WHERE source_tag.slug = expected.source_slug AND clan.slug = 'green-beer'
        AND relation.relation_type = 'member_of'
    ) THEN
      RAISE EXCEPTION 'expected Celtics membership missing for %', expected.source_slug;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM dojo.tag_relation AS relation
    JOIN dojo.tags AS target_tag ON target_tag.id = relation.target_tag_id
    WHERE relation.meta->>'migration' = '082_add_celtics_player_memberships'
      AND (target_tag.slug <> 'green-beer'
        OR relation.relation_type <> 'member_of'
        OR relation.meta->>'affiliation_scope' IS DISTINCT FROM 'professional'
        OR relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
        OR NULLIF(relation.meta->>'evidence_url', '') IS NULL)
  ) THEN
    RAISE EXCEPTION 'Celtics membership target or evidence metadata is incorrect';
  END IF;
END;
$test$;

ROLLBACK;
