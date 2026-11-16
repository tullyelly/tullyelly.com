# Typed tag relationships; WU-1263

WU-1262's accepted decisions govern this contract. Migration 100's effects are
installed and recorded with the canonical checksum in both existing targets,
confirmed independently read-only after the ledger correction documented below.
Migration 098's cleanup and synchronization stay intact. No real aliases or reasons are seeded.

## Shared contract

| Type                   | Direction and endpoints                                               | Cardinality and metadata                                                                 | Reverse meaning                     | Traversal                                            |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `member_of`            | Existing person/supported group to actual group                       | Existing unique edge and evidence unchanged                                              | Members of the group                | Existing membership-only recursion                   |
| `alias_of`             | Alternate name tag to canonical person tag                            | One target per source; many aliases per canonical person; existing object meta preserved | Alternate names of the person       | Exactly one hop; no identity or count of its own     |
| `collected_because_of` | Canonical whole collection subject (person/group) to canonical person | Many-to-many; unique source/type/target; multiple `meta.reasons`                         | Collections inspired by this person | Direct only; never imports chronicles or memberships |

`lib/tag-relationships.ts` owns the application types, reason validation and
reverse display meanings. `listTypedIdentityRelations` reads either direction
without recursion and rejects malformed stored motivation reasons. Existing
untyped helpers remain available for unfamiliar legacy types. The existing
`v_tag_relationships` already exposes all direct types in both directions and
restricts recursion to `member_of`; it needs no replacement.

Each reason is an object with a unique supported `code` (`shared_name` or
`favorite_player`) and a nonblank string `explanation`. Both codes can occur on
one edge. Unknown codes, duplicate codes, empty arrays, missing keys, nonstrings
and whitespace-only explanations fail. Additional reason properties and unrelated
edge metadata survive. Explanations describe history: “He was her favorite
player” establishes neither present preference nor card ownership. Adding future
codes requires a coordinated application/database contract change.

## Identity and direct-write rules

Alias targets must be persons. Source tags may be unclassified alternate names
or persons; clans and known squads/groups cannot alias. Current homie slugs remain
canonical. Family canonical slugs/routes remain canonical; an unclaimed alternate
name can point to `cal`, while `cal` cannot point to another tag. `cal/eldrid` and
`the-lazer/lazer-face` remain distinct in both directions. Known owner evidence
comes from current homie assignment, synchronization ownership, actual canonical
routes/contexts and family roster routes. Different or contradictory known owners
fail; matching names never prove equivalence. A reviewed manifest must establish
semantic same-person evidence before any real alias is inserted (WU-1267).

Self-links, multiple targets, chains and cycles fail atomically. A canonical target
cannot itself be an alias. Membership edges must use canonical endpoints; adding
an alias for a tag with memberships first requires reviewed reconciliation of
those memberships, preserving evidence. Motivation endpoints must be canonical
and cannot be the same tag/known person. A managed retired athlete endpoint is
rejected with a correction to the current `homie.tag_slug`. No automatic guessing,
relation deletion, metadata rewrite or legacy type reclassification occurs.

The new assertions run after INSERT/UPDATE/DELETE statements on tags, homies,
relations, roster items and clans. They reuse 098's transaction advisory lock
before row locks; clans gain that same lock. READ COMMITTED remains required.
VOLATILE checks see the previous lock holder's commit. The unique partial index
also enforces one target per alias. Reverse changes to kinds, routes, ownership,
roster and membership must keep existing relations valid or fail. As with 098,
cooperative roles must not disable triggers or erase ownership evidence to bypass
these rules. Statement checks scan the small direct alias/motivation set; monitor
latency if the graph grows. Unknown relation types retain current direct behavior
and never enter new traversal. Current inspection found only `member_of`.

## Canonicalization and rename integration; WU-1264

`dojo.canonical_tag_id(integer)` returns the stored one-hop target or the input ID.
Callers must still check existence, clickability, authorization and identity kind;
it does not make an unknown ID valid. Direct writes using aliases fail with an
endpoint correction rather than silently changing identity. Application fallback,
feed deduplication, historical routes and authored labels belong to WU-1264.

Before changing a homie's canonical slug with aliases/motivations, WU-1264 must
coordinate with 098's sync under the same lock in one transaction: capture exact
reviewed references/evidence, temporarily detach only that athlete's affected
aliases/motivations, perform the authoritative slug change/sync, then restore
references to the new canonical tag and assert preservation. Keep original edge
IDs, audit evidence, reasons and unrelated meta; resolve duplicate edges only by
an explicit evidence-preserving policy. A failed assertion rolls back everything.
Never move a family identity's references or use a trigger-disable switch. Direct
renames that would strand existing references currently fail; 100 does not supply
that later coordinated operation. Null transitions with references must fail or
be explicitly resolved; no numeric synthetic tag or identity reassignment.

## Evidence and two-file handoff

November 15, 2026 read-only inspection independently confirmed both existing
development and production have 098 and 099 recorded with matching repository
checksums, current athletes 221/eldrid and 219/lazer-face, intact family identities,
and 462 `member_of` edges with no other types. No 100 history/functions were
present at preparation. Existing migration files are unchanged.

James runs in his **existing development** DataGrip connection:

1. `db/migrations/100_validate_typed_tag_relationships.sql`
2. `db/operations/100_record_applied.sql`, only after migration success.

The first file embeds prerequisites, locking, incompatible-row diagnosis and
preservation/effect assertions. It adds functions, validation and triggers without
changing any existing tag or relationship row. The second verifies definitions,
guards and effects, then records the canonical checksum; it never replays SQL.
Expect COMMIT from each, one applied 100 ledger entry and the same 462 existing
memberships. Send success for both files or the first exact error/SQLSTATE and
whether COMMIT occurred. Stop and roll back on migration failure; do not run the
ledger. A ledger failure after successful migration needs ledger repair only.
Cipher then verifies relevant state read-only and resumes at WU-1263's remaining
acceptance evidence before WU-1264. Production uses the same files only after
development validation and the established approval process.

This is additive for current reads and current valid memberships. It tightens
future direct writes, including renames after relationships exist. Keep alias and
motivation consumers/seeds behind installed validation in each target. Do not
merge/deploy on the strength of ledger recording: live application baseline and
the complete guarded diff (including earlier unreleased schema changes) still
require fresh release compatibility evidence and protected approval. Existing
compatibility records are not changed by preparation.

The offline `node scripts/prepare-typed-relationships-package.mjs check` validates
canonical/ledger/reference hashes without accessing any database. Safe unit/mock
and package checks do not prove PostgreSQL trigger/concurrency behavior.
Database-writing behavioral checks remain unrun by Cipher. No migration, seed,
merge or deployment has been performed by Cipher.

## Preparation verification; November 15, 2026

- `CI=true SKIP_DB=true NEXT_TELEMETRY_DISABLED=1 npm run verify:agent` passed
  locally in 126.6 seconds: 254 suites and 2,054 tests passed, two suites/six tests
  skipped, unchanged coverage thresholds passed, and Next production build passed.
  This used installed Node 22.18.0; CI's pinned Node is 22.20.0. No hosted CI result
  is claimed. The baseline log is `/tmp/wu1263-verify.log` for this session.
- Initial focused application/mock/package validation passed 27 tests. After the
  final SQL whitespace alignment and Unicode regression case, the affected reason
  and package suites passed 18 tests; unchanged identity-server tests had passed.
- Offline PostgreSQL 17 parsing with temporary pglast 7.23 passed: canonical SQL
  25 statements/nine PL/pgSQL blocks, ledger 13/four, optional behavioral SQL
  nine/three. Parsing is not schema binding or live behavioral validation.
- Generated ledger/schema checks, changed-file formatting, documentation checks
  and diff whitespace checks passed. The baseline's generated Next environment
  reference change was restored; no authored content or applied SQL was changed.
- `db/tests/100_typed_relationships_test.sql` is an optional James-operated,
  rollback-only development engineering probe before real seeds. It covers valid
  aliases, protected splits, malformed reasons, canonical endpoints, reverse
  metadata changes and rename rejection. Cipher did not execute it. Concurrent
  transaction behavior remains unrun: the lock/index design is prepared, not a
  measured two-session result. These checks are not added to the normal handoff.

WU-1263 remains In Progress pending manual application/read-only verification
and live evidence; later stories are not marked complete. No branch push, PR,
merge or deployment occurred. GitHub's connected branch search returned no remote
epic branch; direct SSH ref inspection was unavailable because SSH authentication
failed. Local branch/worktree selection remains verified and unchanged.

## Ledger correction after DataGrip execution

On November 15 James reported `100: installed definitions differ` while recording
production history. Fresh independent read-only inspection found all five 100
functions, five enabled statement checks, five shared write locks, the unique
alias index and validated reasons constraint in **both** existing targets; the
current invariant assertion passed and each still had 462 relationships. Neither
target had a 100 ledger row. Every installed function body matched the committed
canonical source exactly after CRLF-to-LF conversion. DataGrip's Windows line
endings changed raw `prosrc` hashes, causing the false rejection.

The ledger generator now normalizes CRLF pairs on both sides of the definition
comparison. Standalone carriage returns and actual definition changes remain
fingerprint differences. The canonical migration is unchanged, retaining SHA-256
`717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31`.
The regenerated ledger still checks definitions/effects/conflicts before recording;
it does not execute or replay the migration. Its exact revised definition guard
passed read-only in both targets. Focused regression checks cover LF/CRLF parity,
changed function rejection and exact canonical-byte checksum preservation.

**Recovery at this checkpoint:** roll back the failed ledger transaction, then
run only the updated `db/operations/100_record_applied.sql` in existing development
first. After development success/validation, use that same updated ledger file in
existing production through the established process. Migration 100's effects are
already installed in both; **do not replay the canonical migration**. Expect one
matching applied ledger entry per target. Report success or the first exact
error/SQLSTATE and COMMIT status. Cipher will verify read-only and resume the epic
sequence. No agent database writes occurred; ledger recording and live write/
concurrency behavior remain unverified until further evidence is received.

## Recorded 100; next implementation checkpoint

Fresh read-only inspection after James's ledger correction confirms matching
applied 100 entries in development and production, SHA-256
`717fb826e5787a92e24351854cfa4572c4545afbc3c46d3f17726a4dd9333b31`,
with non-null applied-at and no errors. Earlier pending-recording notes are dated.
[WU-1264's alias resolution and migration 101](tag-alias-resolution.md) now own the
next prepared handoff. Write/concurrency probes and deployment remain distinct;
no automatic Done transition is inferred from the ledger.
