# Same-person alias resolution; WU-1264

WU-1262's accepted decisions and [the typed contract](typed-tag-relationships.md)
remain authoritative. Both existing databases now have migration 100 recorded
with canonical checksum `717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31`.
Migration 101 is installed/recorded in both targets; its function definitions,
preparation trigger and current invariants were verified read-only on November 15.
These application changes are committed locally, not deployed. No real
aliases or motivations have been seeded; WU-1267 owns reviewed mappings.

## Runtime resolution and consumers

`lib/tag-aliases.ts` validates one-hop alias maps and resolves/expands explicit
edges. No name comparison, slug-generation heuristic, membership or motivation
establishes equivalence. Duplicate targets, missing endpoints, self-edges, chains
and cycles reject the snapshot. The server snapshot logs a warning and falls back
to exact-tag behavior if data is invalid or unavailable; it never chooses an
arbitrary target. Unknown tags retain their existing archive/not-found fallback.
`getTagAliasSnapshot` is React request cache only; no session, capability or user
state is cached. Production builds return an empty map before any database read.

| Consumer                                                                                               | Behavior                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tags-server` metadata, layout provider, TagLink, PersonTag, Chronicle renderers, static MDX tag links | Alias links use canonical routing, preserve the source display label, and stay disabled when either endpoint is disabled. Authored `PersonTag.displayName` remains unchanged.                                |
| Dated `getTcdbSnapshotForTagOnDate` / TcdbSnapshot                                                     | Alias/canonical input matches the current homie slug and the same stable homie ID/date; unknown matches still return null.                                                                                   |
| `getHomieTcdbRankingByRouteKey` and `/cardattack/homies/[tagSlugOrId]`                                 | Explicit aliases resolve current ranking; actual historical alias routes redirect to the current homie href. Numeric input remains an ID lookup, including null-slug fallback.                               |
| `listTcdbRankings`, Homies directory search and tag-usage summary                                      | Alias text matches canonical subjects without another player/count. Directory rows remain keyed by stable homie ID.                                                                                          |
| `identity-server` and shared IdentityDetailPage                                                        | Exact/canonical identity reads and direct memberships resolve the canonical slug; directories omit alias identities. Recognized Fam/theabbott alias routes redirect only within a recorded matching context. |
| Homie/clan and shared identity Chronicle feeds; legacy squad member/bonnibel/jeff-meff feeds           | Alias-equivalent tags enter the existing feed filter once per post slug. Callers still supply existing membership inheritance; motivations never import content.                                             |
| `/shaolin/tags/[tag]`, `/shaolin/tags`, `/shaolin`                                                     | Alias archive routes redirect to canonical archives. Counts deduplicate each post's canonical tags. Client search retains alternate spellings in search terms.                                               |
| Site search                                                                                            | Both spellings match Chronicle tags and permitted menu keywords. Existing per-request menu authorization and result deduplication by href remain intact. No inaccessible menu document is added.             |
| Chronicle display-name/mention summaries                                                               | Mentions keep authored labels; alias/canonical usages share one canonical subject and per-post Chronicle count. Multiple literal mentions remain multiple mentions.                                          |

`cal/eldrid` and `the-lazer/lazer-face` are never inferred equivalent. They keep
separate routes, feeds and counts. Existing `member_of` traversal remains the
only recursive relationship. A copied historical membership is not proof of an
alias; 100 requires reviewed membership reconciliation before that tag can become
an alias. WU-1267 handles real copied edges and evidence without guessing here.

Recognized dynamic shapes are `/cardattack/homies/[tagSlugOrId]`,
`/shaolin/tags/[tag]`, `/unclejimmy/fam/[slug]` and `/theabbott/homies/[slug]`.
Existing known legacy Fam redirects in Next configuration remain in place.
An invented alias cannot create an arbitrary static URL, repurpose a squad/group
route or supply a missing persona context. Such unsupported shapes keep existing
404/fallback behavior. Redirects use the current destination per request rather
than permanently caching mutable canonical choices in the browser.

## Direct homie slug changes; migration 101

101 extends 098's existing trigger coordination; 098/099/100 files are immutable.
It shares the existing READ COMMITTED advisory lock and keeps all existing guards
active. Before a slug UPDATE, it validates the destination's known ownership and
reservations and creates only a missing, unclaimed destination tag. It does not
claim its route/owner until the authoritative homie row changes. Null transitions
with aliases/motivations fail with a correction rather than stranding references.

The after-row helper captures and detaches only aliases targeting the former
canonical tag and motivations using that tag. Then the existing sync/retirement
helpers establish the new canonical tag and preserve proven clan membership
behavior. Captured edges are restored directly to the new tag; an old canonical
athlete tag gains a managed direct alias only after 098's ownership proof succeeds.
A -> B -> C therefore keeps A/B/other reviewed aliases pointing to C, with the
same homie/snapshot identity and motivation endpoints. Family relationships are
never selected for movement. Ambiguous destinations, unproved retirement,
non-clan memberships preventing safe aliasing, duplicate edges, conflicting audit
archives or newly added inbound relation references stop atomically for review.

Surviving edge IDs, created-at/by fields, reasons and unrelated meta are retained.
`meta.homie_alias_retarget_history` stores prior edge/audit evidence with linear
history growth. The ordinary audit trigger records the new retarget update.
Returning to a prior alias makes that tag canonical, so its now-invalid self-edge
is retired with the complete old edge/ID archived on the newly retired canonical
tag's alias. No trigger is disabled, ownership authority replaced, permanent
staging table added or recovery service introduced. The homie PATCH handler takes
the same advisory lock before its optimistic row lock; authorization and existing
post-commit cache invalidation remain in place.

Use individual homie slug UPDATE statements. Multi-row identity rewrites with
interdependent references can be rejected by intermediate statement guards;
there is no batch merge/swap operation. Lock/uniqueness/ownership errors require
rollback/review, not automatic retry or a guard bypass. Optional single-homie
behavior and concurrent writes remain unrun by Cipher under the read-only policy.

## Freshness and release ordering

Alias and public tag metadata have no cross-request cache. Direct database edits
appear on the next refreshed server request; refresh the browser/router to replace
a persistent layout provider snapshot. No client mount refetch or global session
cache was added. The existing Homies directory retains its 300-second cache bound
for names/routes/counts; the existing PATCH expires homies/homie-options after
commit. Direct DataGrip edits do not invalidate Next caches by themselves, so
allow that existing bound or use the existing owner-operated revalidation path.
Fresh alias resolution still sends an old cached homie route to its current tag.

Apply 101 before relying on automatic rename retargeting. Consumer reads use the
already installed 100 tables/contract and have safe exact-tag fallbacks; there is
no new query-time schema requirement. Real seeds remain a later reviewed migration.
Production application baseline/full guarded schema diff and protected release
approvals still require current evidence at release time. A matching ledger is
not merge/deployment approval; no existing compatibility record is overwritten.

## James's two-file handoff

Read-only inspection on November 15, 2026 found matching applied 100 records in
both existing targets, no 101 record/helper, no inbound relation foreign keys,
unchanged prerequisite helper bodies after CRLF normalization, and 462 existing
`member_of` edges with no alias/motivation seeds. 101's transaction embeds those
necessary prerequisite checks, locks, guard/effect checks and complete tag/edge
preservation assertions. Installing it does not rename a homie or seed relations.

Run in **existing development** DataGrip, in order:

1. `db/migrations/101_retarget_homie_alias_references.sql`
2. `db/operations/101_record_applied.sql`, only after migration success.

Expect both COMMIT, updated/new rename helpers plus the enabled preparation
trigger, one matching 101 ledger entry, and existing tags/relationships unchanged.
Report success of both or the first exact error/SQLSTATE and whether migration
COMMIT occurred. Stop/ROLLBACK on migration failure and do not run the ledger.
If migration succeeds but recording fails, repair the ledger only; never replay
successful migration SQL. Cipher verifies relevant state read-only, then resumes
WU-1264's remaining evidence and the authorized story sequence. Production follows
development validation and the established approval process, using the same files.

`node scripts/prepare-homie-alias-package.mjs check` is offline-only and binds
canonical, ledger and reference hashes. `db/tests/101_homie_alias_retarget_test.sql`
is an optional James-only development rollback probe, not a normal execution step.
It covers A -> B -> C -> A, motivation/edge evidence, null rejection and the family
collision boundary. Cipher did not run it or any concurrent database-write probe.

## Safe preparation evidence

The local database-disabled full `verify:agent` baseline passed in 118.0 seconds:
256 suites/2,070 tests passed, two suites/six tests skipped, unchanged coverage
thresholds passed (88.63% statements, 81.90% branches, 86.79% functions, 90.06%
lines), and Next production build passed. The installed local Node is 22.18.0;
CI pins 22.20.0. No hosted CI result is claimed. Session log:
`/tmp/wu1264-verify.log`. Additional final feed/count, historical route, lock-order,
snapshot and SQL-package checks passed five suites/19 tests. Focused lint and
TypeScript passed after those final additions. The baseline's generated
`next-env.d.ts` reference change was restored.

Offline PostgreSQL 17 SQL/PLpgSQL parsing covers canonical, ledger and optional
test files; package checks bind the final canonical/ledger/reference hashes.
Parsing, mocked consumers and source checks do not establish live trigger,
concurrency, browser or deployment behavior. No dev server, write suite, seed,
agent database writes, branch push, PR, merge or deployment occurred. WU-1264
remains In Progress at the manual migration boundary; WU-1265+ have not begun.

After James's execution, matching 101 ledger records and normalized installed
function bodies were verified independently in both targets. The manual 101
boundary is cleared; live write/concurrency probes remain unrun. Earlier pending
application statements are dated preparation records. WU-1265's
[motivation readers and maintenance](collection-motivations.md) need no new SQL.
