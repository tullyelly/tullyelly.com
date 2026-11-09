-- Read-only preflight/postflight; James applies migration 097 manually.
-- Before: 21 rows with membership_present=false. After: all true with evidence_valid=true.
BEGIN TRANSACTION READ ONLY;
WITH expected(homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) AS (VALUES
  ('Alvin Robertson', 'alvin-robertson', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Bryn Forbes', 'bryn-forbes', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Charlie Ward', 'charlie-ward', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Chris Paul', 'cp3', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dale Ellis', 'dale-ellis', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('David Robinson', 'the-admiral', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dennis Rodman', 'the-worm', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Devin Vassell', 'devin', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dominique Wilkins', 'dominique-wilkins', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Dāvis Bertāns', 'davis-bertans', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('George Hill', 'blm', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Glenn Robinson', 'big-dog', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Kawhi Leonard', 'kwhhyyy', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Michael Finley', 'fin-dawg', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Moses Malone', 'moses', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Pau Gasol', 'pau', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Sandro Mamukelashvili', 'mamu', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('T.J. Ford', 't-j-ford', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Tim Duncan', 'timmy', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster'),
  ('Tracy McGrady', 't-mac', 'the-monastery', 'professional', 'https://www.si.com/nba/2013/08/26/tracy-mcgrady-retire-nba'),
  ('Victor Wembanyama', 'wemby', 'the-monastery', 'professional', 'https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster')
)
SELECT expected.homie_name, expected.source_slug, clan.slug AS clan_slug,
  homie.id IS NOT NULL AND source_tag.id IS NOT NULL AND target_tag.id IS NOT NULL
    AND source_tag.id <> target_tag.id
    AND (SELECT count(*) FROM dojo.homie AS candidate
         WHERE candidate.tag_slug = expected.source_slug) = 1
    AND clan.name = 'San Antonio Spurs'
    AND source_tag.meta #>> '{identity,kind}' = 'person'
    AND source_tag.meta #>> '{identity,contexts,cardattack,role}' = 'homie'
    AND target_tag.meta #>> '{identity,kind}' = 'group'
    AND target_tag.meta #>> '{identity,contexts,cardattack,role}' = 'clan'
    AS identities_valid,
  relation.id IS NOT NULL AS membership_present,
  relation.meta->>'membership_basis' = 'played_for'
    AND relation.meta->>'affiliation_scope' = expected.affiliation_scope
    AND NULLIF(relation.meta->>'evidence_url', '') IS NOT NULL AS evidence_valid
FROM expected
LEFT JOIN dojo.homie AS homie
  ON homie.name = expected.homie_name AND homie.tag_slug = expected.source_slug
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = expected.clan_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
LEFT JOIN dojo.tag_relation AS relation
  ON relation.source_tag_id = source_tag.id AND relation.target_tag_id = target_tag.id
  AND relation.relation_type = 'member_of'
ORDER BY expected.homie_name;
COMMIT;
