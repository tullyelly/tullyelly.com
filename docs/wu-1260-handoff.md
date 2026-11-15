# WU-1260 migration handoff

## Current checkpoint; WU-1268

WU-1261 through WU-1267 are Done in Jira. All implementation remains on the
shared `epic/WU-1260-tag-relationships` branch. James reported 102 execution;
read-only inspection confirms matching applied migration/ledger state in both
configured existing targets. [Application evidence](evidence/wu-1267-applied-readonly.json)
records two aliases, one motivation, 460 memberships and the exact preserved
LeBron duplicate archives. No SQL replay or new migration is needed.

WU-1268 is In Progress. The integrated verification matrix and maintenance path
below distinguish safe proofs, actual stored state and missing live behavior.
The remaining concrete access boundary is Vercel: project inspection returns 403
for team `team_pB5TcLa7apLtPAiVrRbcjBG3`. Current production application SHA and
complete guarded database diff therefore remain unverified. No release record,
merge, deployment, new database execution or production approval is implied.

## Integrated verification matrix

Evidence carried forward: [typed rules](typed-tag-relationships.md),
[consumer/rename integration](tag-alias-resolution.md),
[motivation queries](collection-motivations.md),
[page/visual evidence](collection-relationship-sections.md), and
[reviewed seeds](reviewed-relationship-seeds.md). The final unchanged code baseline
passed 263 suites/2,102 tests, thresholded coverage and database-free Next build;
two suites/six tests skipped. Local Node 22.18 differs from CI pin 22.20.
No hosted CI or deployed behavior is claimed. Documentation-only follow-ups use
formatting, docs checks and package hash validation; the full baseline is reused.

| Case                                                                | Result and evidence                                                                                                               | Remaining limit                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A -> B -> C; stable owner, one-hop aliases, preserved motivations   | Static SQL/package checks and safe consumer mocks pass; 101 installed and ledger verified                                         | Owner-operated mutation and concurrent conflict probes unrun                    |
| Protected family/squad collisions and later reverse ownership edits | Installed guards/current invariant SELECTs pass; negative contract/package checks pass                                            | Live rollback/error/concurrency behavior unrun                                  |
| cal/the-lazer versus eldrid/lazer-face                              | Both targets preserve exact family routes, homies 221/219 and g-league edges 17/14; no cross alias                                | Deployed navigation unverified                                                  |
| LeBron alias/canonical snapshot                                     | Both targets resolve homie 6/king-james, 2026-11-04 snapshot: 191 cards, rank 43; same result for lebron-james                    | SQL observation plus existing query mocks; deployed route unverified            |
| Alias feed/search/count deduplication                               | Actual feed/search consumers exercised by existing safe integration tests; posts stable-ID deduplicated                           | Mocks are not deployed acceptance                                               |
| LeBron/Lulu direction and historic reason                           | Stored king-james -> lulu favorite_player edge; exact accepted text; both targets verified                                        | Live page unverified                                                            |
| Many-to-many/multiple reasons                                       | Forward/reverse query mocks and validation/package cases pass                                                                     | No invented real rows; live mutation checks unrun                               |
| Fam feed versus inspired collections                                | Identity page and query integration pass; member_of only recursion; separate individual dated counts                              | No unsupported sum; deployed view unverified                                    |
| Disabled/unknown/numeric/old routes and authorization               | Existing route, metadata, snapshot and search tests pass; authorization retained                                                  | No login/session writes or live authenticated browser checks                    |
| Mobile/desktop, keyboard, loading/empty/error                       | Offline actual view at 390/1280 pixels; no overflow; canonical keyboard link and disabled alias tested; safe view/data tests pass | Mock fixture, not production screenshot                                         |
| Cache freshness                                                     | Alias/tag metadata request scoped; browser refresh replaces layout state; Homies bound 300 seconds                                | Direct DB edits do not automatically invalidate Next cache                      |
| SQL/ledger/evidence preservation                                    | 100/101/102 applied checksums match; 102 archives exactly equal frozen pre-state originals and canonical rows                     | Ledger timestamps do not prove separate dev/prod execution chronology           |
| Production application/schema compatibility                         | BLOCKED: Vercel project read returns scope 403                                                                                    | Fresh live SHA and complete guarded diff required before compatibility approval |
| Merge, protected release and public verification                    | UNRUN; no authorization inferred                                                                                                  | Final WU-1268/epic completion remains open                                      |

There are no known failing implementation cases in the safe baseline. Unrun live
cases remain unverified; installed triggers and mocks do not prove concurrency.
The [frozen seed manifest](evidence/wu-1267-reviewed-seeds.json) intentionally keeps
its preparation `applied: false`; later application is separate evidence.

## Short maintenance path

James edits authoritative `dojo.homie.tag_slug` for a single established homie.
098/101 preserve stable owner identity, managed routing and supported memberships,
retarget proven aliases/motivations, and leave custom fields under existing
managed/custom rules. Do not edit generated identity fields to impersonate a new
owner. Null transitions with references, protected destinations, ambiguous prior
ownership or conflicting evidence fail atomically; rollback and inspect the
reported row/identity rather than bypass a guard or retry blindly. Multi-row
identity swaps are not supported by the single-homie path.

For an alias, first verify both endpoints represent the same person and identify
the current canonical owner. Use one direct alternate -> canonical alias_of edge;
no alias chains, multiple targets, family/athlete merges or member_of endpoints
that remain aliases. Removing an alias deliberately ends that equivalence; do
not replay 102 to restore intentionally removed data. Existing alias consumers
retain safe exact-tag fallback for invalid/unavailable snapshots.

For a motivation use canonical whole-subject -> canonical person, one pair with
nonempty unique-code reasons. Initial codes are favorite_player/shared_name.
Keep historical explanation text and unrelated metadata. The parameterized
[add/edit/remove examples](collection-motivations.md) compare previous metadata;
zero returned rows means stale/missing data and requires inspection. Removing
the last reason means deliberate edge removal. These are James's maintenance
operations, not an agent write permission or a new migration handoff.

Refresh the browser after direct edits; allow the existing 300-second Homies
cache bound or the existing owner-operated revalidation path. Read-only inspection:

```sql
SELECT r.id, s.slug AS source, r.relation_type, t.slug AS target, r.meta
FROM dojo.tag_relation r
JOIN dojo.tags s ON s.id = r.source_tag_id
JOIN dojo.tags t ON t.id = r.target_tag_id
WHERE s.slug IN ('king-james', 'lebron-james', 'calvin', 'cal', 'lulu')
   OR t.slug IN ('king-james', 'cal', 'lulu')
ORDER BY r.relation_type, s.slug, t.slug;
```

Calvin Reese stays excluded by James's explicit answer. Future onboarding needs
confirmed exact identity and separate add-person scope. Optional team fandom
needs an approved suitable reason code. David Carr endpoint/intent and the
historical laszlo PersonTag remain per-usage follow-ups in the seed review;
no missing example is silently completed.

## Consolidated SQL order and recovery

These pairs are already applied/recorded in both configured targets. This is an
execution record, not instructions to replay them. Original order was development
first, production through existing approval, migration then ledger only on success:

| Canonical migration                                    | Separate ledger                      | Compatibility                                                      |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------ |
| db/migrations/098_protect_homie_tag_identity.sql       | db/operations/098_record_applied.sql | Identity protection/split prerequisite; preserve WU-1261 cleanup   |
| db/migrations/099_audit_homie_clan_memberships.sql     | db/operations/099_record_applied.sql | Reviewed memberships/evidence prerequisite                         |
| db/migrations/100_validate_typed_tag_relationships.sql | db/operations/100_record_applied.sql | Typed alias/motivation contract before consumers                   |
| db/migrations/101_retarget_homie_alias_references.sql  | db/operations/101_record_applied.sql | Rename synchronization before relying on automatic retargeting     |
| db/migrations/102_seed_tag_relationship_examples.sql   | db/operations/102_record_applied.sql | Real examples require alias-aware application consumers before use |

No new SQL is needed now. Preserve applied files/checksums. On a future ledger-only
failure, investigate committed effects read-only and repair only ledger recording;
never replay a successful migration. Uncertain COMMIT requires inspection first.
No automatic reverse migration or production restore is authorized. Backup/PITR
coverage and a recovery restore were not independently verified in this epic;
no recovery guarantee is claimed and no extra restore ceremony is imposed.

The latest code is local, unmerged and undeployed. Installed SQL keeps canonical
owner/current membership data usable, but historical aliases and relationship
sections require the consumer release. Before release, resolve the live Vercel
baseline, compute the complete binary diff for db/migrations, db/schema and
prisma/schema*, review actual compatibility/backup limits and use the existing
protected approval. An older deferred-schema record is not current evidence;
do not rewrite that protected record or initiate release under generic epic work.

## Historical 098 preparation and execution corrections

The dated records below predate reported execution and the current checkpoint.
Do not rerun 098 or reopen the accepted WU-1262 decisions from these older notes.

Shared branch: `epic/WU-1260-tag-relationships`. WU-1270 now uses the two-file
procedure in [manual migrations](manual-migrations.md). The previous wrapper and
13-step checklist are retired. No database writes or production deployment occurred.

## Normal execution

Run the complete files in order in existing development, then approved production:

1. `db/migrations/098_protect_homie_tag_identity.sql`
2. `db/operations/098_record_applied.sql`, only after the migration succeeds.

Stop if either fails. Roll back a failed migration transaction and do not run the
ledger file. If migration succeeds but recording fails, fix the ledger problem
without automatically replaying migration 098. Investigate uncertain commits
read-only. The second file checks effects/definitions and conflict protection,
then records the canonical filename/SHA-256 in `dojo.schema_migration`.

The migration contains required prerequisites, preservation checks and effect
assertions in one transaction. Existing cleanup, synchronization and collision
protection are retained. There is no normal preflight/postflight, fixture,
multiple-console or cleanup checklist. Files under `db/tests/098*` are optional
engineering tools, not instructions James must execute to apply the migration.

## Engineering evidence and release preparation

Fresh read-only inspection on November 15, 2026 found no 098 ledger record or any
of its new functions in either existing development or production. Family tag
33 still had the old homie kind and tag 274 still had the athlete label. Thus 098
was not applied before this in-place revision. Earlier migrations remain unchanged.
The older [observations](evidence/wu-1261-readonly-observations.json) remain dated
context. Prepared does not mean applied, verified or deployed.

The generated `db/operations/098_record_applied.json` pins finalized canonical and
ledger hashes. Cipher runs `node scripts/prepare-homie-identity-package.mjs check`
and safe automated/static checks. The generator derives ledger effect/definition
checks from the canonical source; it does not execute SQL. Database-writing
behavior/concurrency tests remain unrun under the agent read-only boundary.

Current application columns/routes and READ COMMITTED writer behavior are
unchanged by this process correction. [The feature contract](homie-tag-synchronization.md)
records the existing synchronization limits. Cipher owns read-only verification
and application release compatibility preparation after reported SQL execution.
The complete guarded diff must use a verified live production application baseline,
including earlier unreleased changes. Existing `releases/deferred-schema.json`
contains an older review and is not evidence for revised 098. Fresh Vercel alias inspection
returned scope 403; authorized baseline verification and actual execution
evidence remain necessary before refreshing release compatibility. No stale
baseline, applied status or release approval is invented.

At that earlier checkpoint WU-1262 had not begun; its decisions are now accepted.

## Development execution correction

James reported the original trigger-definition guard failing before cleanup.
Read-only inspection confirmed no 098 ledger/functions in either environment.
The same live trigger renders differently when dojo is visible on search_path;
this caused a false fingerprint mismatch in DataGrip. Migration 098 now sets
transaction-local search_path to pg_catalog before catalog comparisons. The
setting ends with the transaction; schema-qualified feature behavior is unchanged.
Cipher reproduced the mismatch and canonical-path correction read-only, then
regenerated the separate ledger checksum. After ROLLBACK of the failed console,
James uses the current complete migration, then the current ledger only on success.

The next development attempt reached the final preservation assertion and failed
because JSON extraction was not parenthesized before key subtraction. The fix
groups each `#>` extraction before `-`; it does not remove preservation checks.
Cipher ran the exact corrected preservation block read-only with CTE snapshots
and simulated intended cleanup in both databases, including a negative case that
must reject unrelated JSON drift. Nine safe tests passed; the separate ledger
checksum was regenerated. No committed 098 functions or ledger rows were observed.
James must roll back the failed console before retrying the current complete files.

## Current 100 ledger recovery

James's DataGrip execution installed 100's effects in both existing targets, but
recording stopped on a CRLF-sensitive function fingerprint. Read-only comparison
confirmed all five bodies match after line-ending normalization and both ledgers
lack 100. The generator/ledger correction preserves the canonical file/checksum.
Roll back the failed ledger transaction and run **only** the updated
`db/operations/100_record_applied.sql`, development first, then production through
the established process. Do not replay migration 100. The
[correction evidence](typed-tag-relationships.md#ledger-correction-after-datagrip-execution)
owns current recovery status; earlier prepared/unapplied statements above are dated.

The 100 ledger recovery above is now complete in both targets, verified read-only.
The current boundary is the [101 two-file handoff](tag-alias-resolution.md#jamess-two-file-handoff).
Do not replay 098/099/100. No later-story completion or deployment is implied.
