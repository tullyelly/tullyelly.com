# Utah Jazz membership backfill

Read-only inspection on November 1, 2026 confirmed the `Utah Jazz` clan with slug
`jazz` and its canonical tag in both existing development and production. Its
CardAttack identity is a group/clan. Neither database has any incoming `member_of`
relationships for this tag.

The named homie inventory was compared with Jazz playing careers.
[093_add_jazz_player_memberships.sql](../db/migrations/093_add_jazz_player_memberships.sql)
adds these twelve professional memberships, resolving IDs from the current homie
name/tag assignments and the `jazz` clan slug:

| Homie          | Current tag   | Playing-career evidence                                                                                                            |
| -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Armen Gilliam  | armen-gilliam | [Jazz media guide, all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf) |
| Blue Edwards   | blue          | [Jazz media guide, all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf) |
| Danny Manning  | danny         | [Jazz media guide, all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf) |
| Dell Curry     | dell          | [NBA playing-career summary](https://jr.nba.com/so-who-is-stephen-currys-dad/)                                                     |
| Eric Murdock   | murdock       | [Jazz media guide, all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf) |
| Ersan İlyasova | charge        | [Jazz player history](https://www.nba.com/jazz/history/player?pid=101141)                                                          |
| George Hill    | blm           | [Jazz playing-performance award](https://www.nba.com/jazz/news/george-hill-named-nbas-western-conference-player-week)              |
| Grayson Allen  | grayson       | [NBA account of his Jazz rookie performance](https://www.nba.com/news/anthony-edwards-42-points-make-mark-in-nba-rookie-history)   |
| Joe Ingles     | ingles        | [NBA playing-career summary](https://www.nba.com/news/joe-ingles-returns-to-australias-national-basketball-league)                 |
| John Stockton  | john-stockton | [NBA career statistics](https://www.nba.com/player/304)                                                                            |
| Karl Malone    | karl-malone   | [Jazz player history](https://www.nba.com/jazz/history/player?pid=252)                                                             |
| Wes Matthews   | wes           | [Jazz media guide, all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Jazz.pdf) |

These are career memberships, not current-roster assertions. Coaching, draft
rights and signings without playing appearances do not establish a membership.
Moses Malone's ABA Utah Stars career is a different franchise and is excluded.
Wes Matthews is the existing 2009 homie, not his father. No new tags or homies are
created, and no identity is renamed. Unrelated alias changes remain out of scope.
The media guide was checked through indexed official excerpts; some live Jazz
history pages returned empty data, so the listed official sources support the
reviewed positive pairs instead. No unsupported pair was seeded from an empty page.

## Manual execution

Both databases passed the exact read-only endpoint predicate from the migration:
all twelve homie/tag pairs are present and unique, with the expected person/homie
and group/clan metadata. Evaluating the ledger's installed-membership predicate
as a read-only SELECT reports all twelve missing, as expected before application.
Cipher has not applied either file or performed database-writing integration tests.

Run these complete files in order in the existing development DataGrip connection,
validate the results there, then repeat in production under the established
review and human approval procedure:

1. [093 migration](../db/migrations/093_add_jazz_player_memberships.sql)
2. [093 ledger](../db/operations/093_record_applied.sql), after successful migration application.

The migration resolves tag IDs at execution and aborts if a reviewed name/slug
assignment, unique homie endpoint, clan identity or tag metadata has changed.
It inserts `member_of` edges from homie to Jazz with professional `played_for`
evidence. `ON CONFLICT DO NOTHING` preserves existing relationship metadata.
The ledger checks all twelve installed pairs, professional scope and nonempty
playing-evidence URLs before recording the exact original migration checksum.
Matching applied ledger entries remain unchanged; conflicting checksum, algorithm,
status, missing application timestamp or error aborts reconciliation.

Both files use five-second lock and thirty-second statement timeouts, with shared
locks on identities and appropriate relationship/ledger locks. The ledger uses
the existing migration-runner advisory lock. No persistent schema object changes.
After a failure, issue `ROLLBACK;` before rerunning a complete file. Do not replay
older migrations or bulk-mark historical ledger gaps applied.

Original migration SHA-256:

```text
393c2679932ff59f302115e9aef6e58b3f393d1e4633c581cd096c9851215569
```

The ledger timestamps represent reconciliation time; original execution duration
is unknown and remains null. This file records only 093. Other historical ledger
gaps and deployment approval requirements remain separate.

## Read-only postflight

Expect twelve rows with `membership_exists=true`, `professional` scope and
nonempty playing-evidence URLs:

```sql
WITH expected(source_slug) AS (VALUES
  ('armen-gilliam'), ('blue'), ('danny'), ('dell'), ('murdock'), ('charge'),
  ('blm'), ('grayson'), ('ingles'), ('john-stockton'), ('karl-malone'), ('wes')
)
SELECT expected.source_slug, relation.id IS NOT NULL AS membership_exists,
  relation.meta->>'affiliation_scope' AS affiliation_scope,
  relation.meta->>'membership_basis' AS membership_basis,
  relation.meta->>'evidence_url' AS evidence_url
FROM expected
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = expected.source_slug
LEFT JOIN dojo.clan AS clan ON clan.slug = 'jazz'
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
LEFT JOIN dojo.tag_relation AS relation
  ON relation.source_tag_id = source_tag.id
  AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
ORDER BY expected.source_slug;
```

After recording the ledger, expect the exact hash above, `sha256`, `applied`,
non-null `applied_at` and null `error_message`:

```sql
SELECT filename, checksum, checksum_algorithm, status, applied_at, error_message
FROM dojo.schema_migration
WHERE filename = '093_add_jazz_player_memberships.sql';
```

## Local validation

`SKIP_DB=true npm run verify:agent` passed in 125.8 seconds: workflow validation,
content preparation, lint/docs, TypeScript, Prisma generation, 248 Jest suites and
2,006 tests with coverage thresholds, and the Next production build. Two opt-in
suites and six tests were skipped. Static seed/write-scope/checksum assertions
and changed-file formatting passed. These checks do not apply SQL or establish
post-application database validation.
