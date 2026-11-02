# Homie and clan reconciliation

Read-only Neon inspection on November 1, 2026 compared the existing `production`
and `development` branches of project `tullyelly.com`, database `tullyelly_db`.
The actual domain tables are `dojo.homie`, `dojo.clan`, `dojo.tags` and
`dojo.tag_relation`. Cipher performed no database writes.

Production contains 23 clans and 1,223 homie rows: 232 named rows and 991 literal
`backfill` placeholders. All clans have matching tags by `clan.slug`. All 230
assigned named homie identities have matching tags by `homie.tag_slug`; their
CardAttack person/homie metadata and the clans' group/clan metadata are present.
There are no dangling tag relationship endpoints. No missing tag creation is
needed for the reviewed identities.

Two unassigned named rows remain: duplicate Peter Warrick (draft year 2000) and
Tiger Woods (2001). Their existing tagged counterparts are `warrick` and `tiger`.
These files do not merge or delete domain records, assign duplicate identities,
rename tags, or modify any placeholder rows, including four tagged placeholders.
`Cal Eldrid` remains held for review: the `cal` tag routes to Uncle Jimmy's Fam.
No baseball membership is inferred for that shared identity.

## Missing relationships

[090](../db/migrations/090_restore_homie_alias_memberships.sql) restores twelve
explicit membership pairs on six currently assigned aliases. The reviewed
memberships still exist on the old full-name tags. New edges copy the old edge's
metadata, including evidence and college/professional scope, and record the old
slug and migration as provenance. Both tags and all original edges remain.

| Homie           | Existing old tag | Current assigned tag | Missing clan links                                   |
| --------------- | ---------------- | -------------------- | ---------------------------------------------------- |
| Dennis Rodman   | dennis-rodman    | the-worm             | purple-and-gold                                      |
| Desmond Mason   | desmond-mason    | desmond              | bucks-n-six                                          |
| Dikembe Mutombo | dikembe-mutombo  | dikembe              | rockets                                              |
| Juwan Howard    | juwan-howard     | juwan                | blazers, heat-culture, rockets                       |
| Pau Gasol       | pau-gasol        | pau                  | bucks-n-six, purple-and-gold                         |
| Wes Matthews    | wes-matthews     | wes                  | blazers, bucks-n-six, golden-eagles, purple-and-gold |

[091](../db/migrations/091_complete_homie_clan_memberships.sql) adds eighteen
additional positive playing-career matches using current assigned slugs.

| Clan                                   | Missing homies                           | Evidence                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Memphis Grizzlies (`vancouver`)        | Allen Iverson, Ja Morant, Pau Gasol      | [2025-26 team guide, all-time roster and Morant career](https://s3.grizzliesapp.com/assets/media_guides/25-26/MG_25-26_MediaGuide.pdf)                                 |
| Memphis Grizzlies (`vancouver`)        | Blue Edwards, Eric Murdock, Lee Mayberry | [2016-17 team guide, Vancouver season reviews and all-time roster](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Grizzlies.pdf) |
| Memphis Grizzlies (`vancouver`)        | Grayson Allen                            | [Team game report](https://www.nba.com/grizzlies/news/postgame/uta-200805)                                                                                             |
| Memphis Grizzlies (`vancouver`)        | Sam Merrill                              | [NBA career biography](https://api-hub.nba.com/player/1630241/sam-merrill/bio)                                                                                         |
| Memphis Grizzlies (`vancouver`)        | Vince Carter                             | [Kings career recap](https://www.nba.com/kings/news/kings-sign-vince-carter)                                                                                           |
| Milwaukee Bucks (`bucks-n-six`)        | AJ Johnson                               | [Wizards acquisition and seven Milwaukee appearances](https://www.nba.com/wizards/news/wizards-acquire-middleton-johnson-from-milwaukee-bucks)                         |
| Milwaukee Bucks (`bucks-n-six`)        | Cole Anthony                             | [Official October 24, 2025 box score](https://statsdmz.nba.com/pdfs/20251024/20251024_MILTOR_book.pdf)                                                                 |
| Milwaukee Bucks (`bucks-n-six`)        | Lindsey Hunter                           | [Official January 23, 2001 box score](https://www.nba.com/game/nyk-vs-mil-0020000592/box-score)                                                                        |
| Los Angeles Lakers (`purple-and-gold`) | Lindsey Hunter                           | [Lakers 2001-02 season capsule](https://www.nba.com/lakers/history/season-capsule)                                                                                     |
| Los Angeles Lakers (`purple-and-gold`) | Bronny James Jr.                         | [NBA account of Lakers appearance](https://cdn-uat.nba.com/news/bronny-james-plenty-to-learn-after-return-to-lakers)                                                   |
| Los Angeles Lakers (`purple-and-gold`) | Julius Randle                            | [NBA career biography](https://www.nba.com/player/203944/julius-randle/bio)                                                                                            |
| Minnesota Timberwolves (`t-wolves`)    | Julius Randle                            | [October 29, 2025 postgame notes](https://cdn.nba.com/teams/uploads/sites/1610612750/2025/10/10.29-LAL-Postgame-Notes.pdf)                                             |
| Miami Heat (`heat-culture`)            | Tyler Herro                              | [NBA season debut report](https://www.nba.com/news/tyler-herro-return-2025-26-season-debut)                                                                            |
| Milwaukee Bucks (`bucks-n-six`)        | Tyler Herro                              | [October 28, 2026 game and postgame report](https://www.nba.com/bucks/game/0022600138-rockets-vs-bucks-milwaukee-wi-10-28-2026/event-details)                          |

The team guides were available as indexed excerpts; full PDF retrieval failed.
Individual official reports support the other pairs. Each new pair stores an
evidence URL. Vancouver is the same franchise now in Memphis; preserve the
existing `vancouver` slug. These are career memberships, including former teams,
not current-roster assertions. Signings without playing appearances, draft rights
and coaching posts are excluded. Cole Anthony's waived Memphis signing and Pau
Gasol's Portland signing do not establish played-for memberships.

All 23 clans were compared with the named homie inventory and existing edges.
No additional positive pair is proposed for the other clans. An empty membership
list alone is not evidence of a missing affiliation: `texans`, `phillies` and
`pirates` remain empty. This is a reviewed set of positive matches, not a new
external roster synchronization system or proof that every possible historical
relationship has been independently documented. Existing relationships are
preserved without reclassifying or deleting them.

## Manual development-first handoff

1. Review migrations 090 and 091 and their SHA-256 checksums. Inspect actual
   prerequisite schema and identities; an absent ledger record alone does not
   mean an older migration should be replayed.
2. In the existing development DataGrip connection, run the
   [read-only comparison](../db/tests/090_091_homie_clan_memberships_check.sql).
   On November 1, both development and production returned 30 valid endpoint
   pairs, all missing. The exact endpoint/evidence failure predicates from both
   migrations also returned no problems on both branches.
3. James executes each complete transaction, 090 followed by 091, in development.
   The files resolve IDs at execution, require the reviewed name/slug assignment,
   unique homie endpoints, identity metadata and existing clan tags. Migration
   090 additionally requires each reviewed legacy edge and its playing evidence.
   A failed check aborts the transaction with affected slug pairs. After a failed
   run, issue `ROLLBACK;` before rerunning the complete file.
4. Rerun the read-only comparison; all 30 `endpoints_valid` and
   `membership_exists` values must be true. Validate the affected identity pages
   using the existing app. Cipher can inspect the results read-only.
5. After development validation, obtain the required concrete production review
   and human approval, repeat fresh production preflight, then James executes the
   same reviewed files in the existing production connection and checks postflight.
   Follow the [manual ledger procedure](analytics-neon-setup.md); reconcile only
   individually executed, exact-checksum files. Do not run apply-all/status/verify
   to initialize or infer ledger history.

Both migrations insert relationships only, retain audit triggers, and use
`ON CONFLICT DO NOTHING` to preserve existing relationship metadata on reruns.
They take shared identity-table locks and a `SHARE ROW EXCLUSIVE` relationship
lock; concurrent writes can briefly wait. Lock and statement timeouts are five
and thirty seconds. No persistent schema objects, routes or application code
change. Existing membership reads continue to determine page freshness.

James reports successful execution of both migrations in development and
production. Cipher subsequently verified all 30 relationships and their expected
evidence/provenance read-only on both branches. Database-writing integration
tests and application UI validation have not been performed by Cipher. No
recovery drill or backup coverage was established by this reconciliation;
retain the existing recovery limitations for the production review.

Reviewed migration SHA-256 values:

```text
090_restore_homie_alias_memberships.sql
ebc4ef13882e91d3f2872a7158502474539b4d843dbc5d49beef177a74280113
091_complete_homie_clan_memberships.sql
0ea3f65bb3212087460f36d6c33c946d5bceb20684e1331213dd37b036adff7f
```

## Local validation

`SKIP_DB=true npm run verify:agent` passed: 248 Jest suites and 2,006 tests,
coverage thresholds, TypeScript, lint, documentation checks, workflow validation,
Prisma generation and the Next production build. Two suites and six opt-in tests
were skipped. The initial sandboxed attempt failed before Jest at TypeScript
`--showConfig`; the database-disabled retry outside the sandbox completed in
120.6 seconds. The new migration regression suite passed in that full run.
Explicit changed-file formatting and ESLint also passed. These checks do not
execute either SQL migration or establish post-application database validation.

## Applied execution and ledger reconciliation

James reports that the unchanged 090 and 091 files were installed successfully
in both existing databases. Read-only postflight on November 1, 2026 confirmed
all 30 expected relationships, exact current name/slug assignments and the
migration-specific evidence/provenance checks in each database. Neither database
has a ledger row for 090 or 091 yet.

Run these complete DataGrip files in order in existing development, then in
production under the established approval procedure:

1. [090_record_applied.sql](../db/operations/090_record_applied.sql)
2. [091_record_applied.sql](../db/operations/091_record_applied.sql)

Each file rechecks its installed memberships and evidence, obtains the existing
migration-runner advisory lock and locks the relevant tables, then inserts only
its exact original migration filename/hash. A matching applied row remains
unchanged. Any conflicting checksum, algorithm, failed status, absent application
timestamp or recorded error aborts the transaction. No migration is replayed and
no unrelated ledger rows are modified. Run `ROLLBACK;` after a failed attempt
before retrying the complete file.

The new timestamps represent reconciliation time. The original execution time
and duration are unknown, so `execution_ms` remains null. Cipher has not executed
these ledger files.

Read-only postflight after James runs both files:

```sql
SELECT filename, checksum, checksum_algorithm, status, applied_at, error_message
FROM dojo.schema_migration
WHERE filename IN (
  '090_restore_homie_alias_memberships.sql',
  '091_complete_homie_clan_memberships.sql'
)
ORDER BY filename;
```

Expect both original hashes listed above, algorithm `sha256`, status `applied`,
non-null `applied_at` and null `error_message`. Other historical ledger gaps were
also observed on both databases; these two files reconcile only 090/091 and do
not establish that a full-ledger deployment gate will pass. Historical execution
must be reviewed separately rather than bulk-marked applied. Existing release
compatibility checks and human approval requirements remain in force.

## Michigan follow-up: migration 092

A fresh November 1, 2026 read-only comparison found 24 clans in both existing
production and development. The new Michigan Wolverines clan is `fab-five`; its
canonical tag and CardAttack group/clan identity already exist. No clan tags or
assigned named homie tags are missing on either branch.

One new migration,
[092_add_michigan_and_restore_traylor_memberships.sql](../db/migrations/092_add_michigan_and_restore_traylor_memberships.sql),
adds seven college playing memberships and restores one newly disconnected alias
membership. Migrations 090/091 and their original checksums remain unchanged.

| Homie           | Current tag     | Clan        | Scope and evidence                                                                                                                  |
| --------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Charles Woodson | charles-woodson | fab-five    | College; [Michigan Heisman history](https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history)                           |
| Desmond Howard  | desmond-howard  | fab-five    | College; [Michigan Heisman history](https://mgoblue.com/sports/2017/6/16/football-heisman-trophy-history)                           |
| Chris Webber    | timeout         | fab-five    | College; [Michigan Fab Five and Howard playing career](https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943) |
| Jalen Rose      | jalen-rose      | fab-five    | College; [Michigan Fab Five and Howard playing career](https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943) |
| Juwan Howard    | juwan           | fab-five    | College; [Michigan Fab Five and Howard playing career](https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943) |
| D.J. Wilson     | dj              | fab-five    | College; [Michigan professional alumni](https://mgoblue.com/sports/2017/6/16/wolverines-in-professional-basketball)                 |
| Tractor Traylor | tractor         | fab-five    | College; [Michigan Robert Traylor playing honors](https://mgoblue.com/documents/download/2021/11/5/bkm_honors_awards.pdf)           |
| Tractor Traylor | tractor         | bucks-n-six | Professional; [official Bucks box score](https://www.nba.com/game/mil-vs-bos-0029800446/box-score)                                  |

The stored `Tractor Traylor` homie now uses `tractor`; its Bucks membership still
exists on the old `tractor-traylor` tag. The new migration adds the reviewed edge
on `tractor` without deleting the old tag or edge. The existing homie name is
preserved; Robert Traylor is the university source's name for the same player.

The full named homie inventory was reviewed for Michigan matches. Tim Hardaway
(drafted 1989) and Glenn Robinson (1994) are not their Michigan-playing sons;
neither receives a Michigan edge. The fictional Wolverine tag is also excluded.
The two unassigned duplicate-name homies and placeholder exclusions above remain.

All eight expected pairs are missing in both databases, with valid, unique
homie/tag endpoints. The exact migration endpoint predicate and ledger membership
predicate were evaluated as read-only SELECTs on each branch: endpoint checks
passed and the ledger check reported all eight missing, as expected before
application. No migration or ledger writes were executed by Cipher.

Run these two complete files in order, development first, then approved production:

1. [092 migration](../db/migrations/092_add_michigan_and_restore_traylor_memberships.sql)
2. [092 ledger](../db/operations/092_record_applied.sql), only after the migration succeeds.

The migration preserves existing relationship metadata with `ON CONFLICT DO
NOTHING`, resolves tag IDs at execution and aborts on changed name/slug identities,
non-unique homie endpoints, a missing Michigan clan/tag or incompatible identity
metadata. The ledger file checks all eight installed memberships, their
college/professional scopes and playing evidence before recording its exact
original checksum. It leaves matching ledger rows unchanged and rejects conflicting
history. Both files use five-second lock and thirty-second statement timeouts.
After a failure, issue `ROLLBACK;` before rerunning the complete file.

The original migration SHA-256 is
`312e55bdb833c3174ce37fcf9b5d9cace32c81addc5b79d2288edea76573d508`.
The ledger records reconciliation timestamps and a null unknown execution duration.
It records only 092; older unrelated ledger gaps remain separately reviewed.

Read-only relationship postflight; expect eight rows, all `membership_exists=true`,
with seven college rows and one professional row:

```sql
WITH expected(source_slug, clan_slug) AS (VALUES
  ('charles-woodson', 'fab-five'),
  ('desmond-howard', 'fab-five'),
  ('timeout', 'fab-five'),
  ('jalen-rose', 'fab-five'),
  ('juwan', 'fab-five'),
  ('dj', 'fab-five'),
  ('tractor', 'fab-five'),
  ('tractor', 'bucks-n-six')
)
SELECT expected.*, relation.id IS NOT NULL AS membership_exists,
  relation.meta->>'affiliation_scope' AS affiliation_scope,
  relation.meta->>'evidence_url' AS evidence_url
FROM expected
LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = expected.source_slug
LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = expected.clan_slug
LEFT JOIN dojo.tag_relation AS relation
  ON relation.source_tag_id = source_tag.id
  AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
ORDER BY expected.source_slug, expected.clan_slug;
```

Read-only ledger postflight; expect the original hash above, `sha256`, `applied`,
non-null `applied_at` and null `error_message`:

```sql
SELECT filename, checksum, checksum_algorithm, status, applied_at, error_message
FROM dojo.schema_migration
WHERE filename = '092_add_michigan_and_restore_traylor_memberships.sql';
```

The 092 follow-up passed `SKIP_DB=true npm run verify:agent` in 117.8 seconds,
including 248 Jest suites, 2,006 tests, coverage thresholds and the Next production
build. Two opt-in suites and six tests were skipped. Formatting, documentation
checks and static seed/checksum/write-scope assertions passed. Database-writing
validation remains unrun; the live checks above were read-only preflight.
