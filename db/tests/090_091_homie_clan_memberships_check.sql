-- Read-only preflight/postflight for migrations 090 and 091.
-- Before application: 30 rows with membership_exists=false in the inspected snapshot.
-- After application: all endpoints_valid and membership_exists must be true.
BEGIN READ ONLY;

WITH expected(homie_name, source_slug, clan_slug) AS (VALUES
  ('Dennis Rodman', 'the-worm', 'purple-and-gold'),
  ('Desmond Mason', 'desmond', 'bucks-n-six'),
  ('Dikembe Mutombo', 'dikembe', 'rockets'),
  ('Juwan Howard', 'juwan', 'blazers'),
  ('Juwan Howard', 'juwan', 'heat-culture'),
  ('Juwan Howard', 'juwan', 'rockets'),
  ('Pau Gasol', 'pau', 'bucks-n-six'),
  ('Pau Gasol', 'pau', 'purple-and-gold'),
  ('Wes Matthews', 'wes', 'blazers'),
  ('Wes Matthews', 'wes', 'bucks-n-six'),
  ('Wes Matthews', 'wes', 'golden-eagles'),
  ('Wes Matthews', 'wes', 'purple-and-gold'),
  ('Allen Iverson', 'allen-iverson', 'vancouver'),
  ('Blue Edwards', 'blue', 'vancouver'),
  ('Eric Murdock', 'murdock', 'vancouver'),
  ('Grayson Allen', 'grayson', 'vancouver'),
  ('Ja Morant', 'ja-morant', 'vancouver'),
  ('Lee Mayberry', 'mayberry', 'vancouver'),
  ('Pau Gasol', 'pau', 'vancouver'),
  ('Sam Merrill', 'sam', 'vancouver'),
  ('Vince Carter', 'vince-carter', 'vancouver'),
  ('AJ Johnson', 'aj', 'bucks-n-six'),
  ('Cole Anthony', 'cole', 'bucks-n-six'),
  ('Lindsey Hunter', 'lindsey', 'bucks-n-six'),
  ('Lindsey Hunter', 'lindsey', 'purple-and-gold'),
  ('Bronny James Jr.', 'bronny', 'purple-and-gold'),
  ('Julius Randle', 'orange-julius', 'purple-and-gold'),
  ('Julius Randle', 'orange-julius', 't-wolves'),
  ('Tyler Herro', 'herro', 'heat-culture'),
  ('Tyler Herro', 'herro', 'bucks-n-six')
)
SELECT expected.*,
  (homie.id IS NOT NULL AND source_tag.id IS NOT NULL
    AND clan.id IS NOT NULL AND target_tag.id IS NOT NULL
    AND source_tag.id <> target_tag.id) AS endpoints_valid,
  (relation.id IS NOT NULL) AS membership_exists
FROM expected
LEFT JOIN dojo.homie AS homie
  ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
LEFT JOIN dojo.tag_relation AS relation
  ON relation.source_tag_id = source_tag.id
  AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
ORDER BY expected.source_slug, expected.clan_slug;

ROLLBACK;
