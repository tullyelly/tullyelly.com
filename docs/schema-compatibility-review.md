# Application compatibility review

## Current WU-1242 review; November 1, 2026

[Production run 41382584230](https://github.com/tullyelly/tullyelly.com/actions/runs/41382584230)
for merged candidate `6dc57341093e127c0f5cce7ffeef5527e032eeab` failed at
`code.sensitive-compatibility-review`, before the protected production job or
human approval gate. Exact-SHA CI had passed. The guard worked correctly: the
WU-1226 record still named baseline `b02bf5c659c0dec985f36e7157d07f0dae2d8280`
and a diff containing only migration 089. Both bindings were stale.

Read-only Vercel inspection resolved both `tullyelly.com` and `www.tullyelly.com`
to READY production deployment `dpl_7NhokZgVao9mgcRwfLnXQxMK115L`, project
`prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team
`team_pB5TcLa7apLtPAiVrRbcjBG3`. Its application SHA is
`a7706088e12bd9c38abfe3f6386a3ae502f1c472`. Alias destinations and provider Git metadata
identify the production baseline; migration ledgers cannot establish it.

The complete guarded diff from that baseline to the candidate consists of seven
added data migrations, 090 through 096. There are no changes under `db/schema` or
`prisma/schema*`, and migration 089 is already in the production application
baseline. The exact binary diff digest is:
`81f6f9894cff38d49745af05af4a97936ea3c497e6a140f92acb684b32476bc6`.

| Migration                                                                    | Reviewed effect                                                               | Original SHA-256                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [090](../db/migrations/090_restore_homie_alias_memberships.sql)              | Restore 12 current-alias homie/clan relations, preserving legacy evidence     | `ebc4ef13882e91d3f2872a7158502474539b4d843dbc5d49beef177a74280113` |
| [091](../db/migrations/091_complete_homie_clan_memberships.sql)              | Add 18 reviewed professional homie/clan relations                             | `0ea3f65bb3212087460f36d6c33c946d5bceb20684e1331213dd37b036adff7f` |
| [092](../db/migrations/092_add_michigan_and_restore_traylor_memberships.sql) | Add seven Michigan college relations and one current-alias Bucks relation     | `312e55bdb833c3174ce37fcf9b5d9cace32c81addc5b79d2288edea76573d508` |
| [093](../db/migrations/093_add_jazz_player_memberships.sql)                  | Add 12 Utah Jazz professional relations                                       | `393c2679932ff59f302115e9aef6e58b3f393d1e4633c581cd096c9851215569` |
| [094](../db/migrations/094_complete_public_menu_coverage.sql)                | Add 15 public destinations and clear eight public browse menu gates           | `f667053fcf6bf53f5ab25c2661c63052d1fefc22932de8f6818f0372a2bb7e0b` |
| [095](../db/migrations/095_restrict_admin_menu_requirements.sql)             | Merge two explicit Admin requirements while retaining attribution             | `e8952aaa34b9c4dbe00cfd6d594d439a17ab79890d67c7cd6d2a0bdd3870f490` |
| [096](../db/migrations/096_lowercase_visible_menu_labels.sql)                | Lowercase published, non-hidden menu labels with no unnecessary audit changes | `01dd48d552bcb84193297aab0c283ba60734f099bb5d2d59b72b67167d756ce8` |

The rest of the complete `db/` diff was reviewed too: 16 operations files
(ledger/atomic bundles and read-only preflight/postflight) plus one 090/091
check file are outside the guarded roots. None runs during application builds,
startup or the ordinary production workflow. They are not authorized for execution
by this record. The full diff contains 24 added database files: seven migrations
and 17 handoff/check files.

### Fresh read-only evidence

Both existing `tullyelly_db` targets in project `rough-bush-94516855` were checked
independently: development `br-crimson-fog-ae22ws22` and production
`br-withered-snow-aea0yck6`. Each check used an explicit repeatable-read READ ONLY
transaction and confirmed `transaction_read_only=on`.

- Both ledgers contain exact original-file SHA-256 applied entries for 089-096,
  with non-null applied timestamps and no errors. These observations supersede
  historical missing-ledger notes for those files; other historical gaps remain
  unresolved and outside this review. No entry was inserted or rewritten.
- The installed-effect DO assertions from the first, read-only block of
  `090_record_applied.sql` through `093_record_applied.sql` all passed. Only those
  effect blocks were run, without their write-producing ledger blocks or locks.
- The 094 public-menu postflight assertion block passed after its addition-label
  comparison was normalized with `lower()` to honor already-applied 096. All
  duplicate/identity, root, public-state, order and requirements checks remained.
  The applied 094 file itself was not changed or replayed.
- Exact 095 and 096 postflight DO assertions passed. Both menus have 48 rows and
  zero mixed-case published, non-hidden labels. Admin retains
  `menu.mark2.admin` with `admin.app.view` and `admin.membership.manage` in
  `meta.requires`; capability existence, enabled scopes and the legacy no-grants
  assumption were checked by 095's assertions.

### Application compatibility and release boundary

090-093 are additive domain relationship data in existing tables. Their temporary
seed tables exist only during manual SQL execution; they introduce no persistent
schema or runtime contract. 094-096 change navigation data in the existing menu
schema, with no role grants, feature enablement, user memberships or server-side
mutation authorization changes.

The candidate's shared resolver enforces every normalized explicit requirement,
falls back to the existing feature key and preserves attribution. Old application
code with installed 095 still checks its ungranted legacy Admin key and denies;
new code enforces both real landing requirements. The Analytics link reuses owner
identity and strict capability enforcement inside the existing Admin layout;
no owner decision enters the shared capability cache. Existing mutation checks
remain in place. Lowercase labels and membership additions need no SQL replay for
this application to run. Menu revalidation remains 300 seconds.

This change updates the existing application-only compatibility record and owning
documentation. It changes no guard code, immutable migration, checksum in a
ledger, analytics intent or readiness configuration. It does not claim a new
release has passed or authorize migration execution. The fix must be reviewed and
merged; then its new exact main SHA needs successful trusted CI before a fresh
protected dispatch. The failed immutable run cannot use an unmerged record.
Human `production-release` approval remains mandatory. Do not automatically merge,
approve, retry deployment or restore production. Actual backup coverage and
unrun recovery checks are unchanged from the existing handoffs.

Use the validator's exact complete diff command to verify the record:

```bash
git diff --no-ext-diff --no-textconv --binary --full-index --no-color \
  --unified=3 --diff-algorithm=myers --no-indent-heuristic \
  --src-prefix=a/ --dst-prefix=b/ --no-renames \
  a7706088e12bd9c38abfe3f6386a3ae502f1c472 \
  <reviewed-candidate-sha> -- db/migrations db/schema 'prisma/schema*' | sha256sum
```

Record/documentation-only commits preserve that database diff. A changed baseline
or any new guarded SQL still invalidates the binding and requires fresh review.

## Historical WU-1213 review

### Decision and failed release

The candidate application is compatible with the inspected database. No database
write is required to resolve this compatibility block. The compatibility record
is a review proposal; it does not authorize another release or SQL execution.

[Production run 41011143959](https://github.com/tullyelly/tullyelly.com/actions/runs/41011143959)
failed during evidence preparation with `code.sensitive-compatibility-review`;
the protected production job was skipped. The failed candidate was merged PR 668,
`ab7da7cc541ffc78589213904110408b3ca42c57`. Both required checks passed in
[CI run 41010595041](https://github.com/tullyelly/tullyelly.com/actions/runs/41010595041).
No deployment was created by that failed preparation.

Read-only Vercel lookups for both `tullyelly.com` and `www.tullyelly.com` on
October 30, 2026 resolved to READY production deployment
`dpl_5kXM8TLD21DfraQPSPohSZVH7RHb`, application SHA
`819966fde2630f8b86f19c5897e2701ab824a157`, project
`prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team
`team_pB5TcLa7apLtPAiVrRbcjBG3`. These provider reads identify the application
baseline; a database ledger does not identify which application is deployed.

The old record instead named `ee1ee21450276885363bd388db376a0c97ab1900` and a
diff covering migrations 083-087/category mirrors. Both its baseline binding and
its diff binding are stale. The validator intentionally rejects either mismatch.

## Complete database-file review

From the actual production baseline to the candidate, the entire diff covered by
`scripts/release/schema-deferral.ts` contains exactly:

- Added `db/migrations/088_enforce_homie_tcdb_snapshot_difference_sign.sql`;
  transactionally locks the snapshot table, corrects invalid signs, then adds a
  validated sign check. It changes no columns or application grants. Existing
  audit and ranking-refresh triggers remain active. A first-place integer minimum
  cannot be made positive and deliberately aborts. Replaying the file when the
  named constraint already exists fails; the transaction must be rolled back.
- Modified `db/schema/tables/homie_tcdb_snapshot.sql`; adds the same check to the
  declarative table mirror. No application build or startup executes this mirror.

There are no other changes under `db/migrations`, `db/schema` or
`prisma/schema*`. Migrations 083-087 and category mirrors are unchanged relative
to this baseline, regardless of their database ledger status. They must not be
included in a new claim that SQL needs replaying.

The exact binary diff digest is
`82883fa5f4fe1e4d412495e02e0ea01444b37b70f108ac7ba257c938d8400570`.
It is computed with the validator's complete argument list, not a concatenation
of file checksums:

```bash
git diff --no-ext-diff --no-textconv --binary --full-index --no-color \
  --unified=3 --diff-algorithm=myers --no-indent-heuristic \
  --src-prefix=a/ --dst-prefix=b/ --no-renames \
  819966fde2630f8b86f19c5897e2701ab824a157 \
  ab7da7cc541ffc78589213904110408b3ca42c57 \
  -- db/migrations db/schema 'prisma/schema*' | sha256sum
```

The rest of the complete `db/` diff was also reviewed. Outside those guarded
roots, it contains eight analytics handoff files:

- `db/diagnostics/analytics-schema.sql`; only its read-only target comment changes.
- `db/diagnostics/analytics-validation.sql`; SELECT-only UTC reconciliation and
  bounded provenance checks inside a read-only transaction.
- `db/operations/analytics/00_read_only_preflight.sql` and
  `90_read_only_postflight.sql`; read-only catalog/privilege/ledger checks.
- `db/operations/analytics/01_initialize_ledger.sql`, `076_apply_with_ledger.sql`
  and `077_apply_with_ledger.sql`; manual write-producing bundles. The normal
  application release does not invoke them. The ledger and exact 076/077 applied
  entries already exist; these files must not be replayed for this release.
- `db/operations/analytics/SHA256SUMS`; manual bundle integrity metadata.

Those eight files are outside the guard's schema digest; they are not silently
excluded from this review or authorized for execution by the deferral record.

## Read-only database evidence

The existing Neon project is `rough-bush-94516855`; both databases are
`tullyelly_db`. No branch, endpoint, role, setting or credential was changed.
Times below are UTC on October 30, 2026 (01:05 onward in Chicago). Inspection
does not identify when or by whom the constraint was installed, or prove which
correction SQL was used.

| Observation                      | Existing production                                      | Existing development                                     |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Branch                           | `br-withered-snow-aea0yck6`                              | `br-crimson-fog-ae22ws22`                                |
| Constraint/data inspection time  | 06:05:48.503Z                                            | 06:05:51.813Z                                            |
| Snapshot rows                    | 349                                                      | 341                                                      |
| Rows violating the sign rule     | 0                                                        | 0                                                        |
| First-place integer-minimum rows | 0                                                        | 0                                                        |
| Named sign constraint            | Present, validated, exact expression                     | Present, validated, exact expression                     |
| Ledger entries for 083-088       | None                                                     | None                                                     |
| Ledger entries for 076/077       | Applied, exact repository SHA-256, timestamps, no errors | Applied, exact repository SHA-256, timestamps, no errors |

The exact constraint expression is
`(ranking = 1 AND difference >= 0) OR (ranking <> 1 AND difference < 0)`.
The catalog confirms NOT NULL integer `ranking`/`difference` columns. Production
ownership is `tullyelly_admin`; audit and both ranking-refresh triggers are
enabled. Catalog privilege checks confirm schema usage and snapshot SELECT/INSERT
for the application role. A separate read as `tullyelly_admin` at 06:06:20.579Z
successfully selected the production table; it did not insert or update a row.

The 088 file SHA-256 is
`ba4160b37c7b5f6b98667f82d51d0975e4a7698b69ef409c2c4b623133b0aac3`.
There is no ledger row binding that file to a completed execution in either
existing database. Do not turn matching effective schema into an invented
`applied` record or claim the original migration ran. Historical ledger
reconciliation requires separate owner evidence and review.

Production category tables/view and ranking/difference columns are present;
the missing 083-087 ledger entries do not prove missing schema. This review does
not attest every effect of 083-087 or the Marquette membership backfill.

## Application compatibility and remaining limits

The homie snapshot API, client form, readers and ranking routes are unchanged
between production and the candidate. They use existing columns; deploying the
candidate adds no dependency on executing 088. Readers retain signed differences
and existing ranking semantics. The existing API accepts any integer difference;
the database rejects an invalid sign, returned as its existing generic snapshot
failure. Field-specific sign validation is not introduced by this release. This
limitation exists against the already constrained production database and is not
resolved by replaying SQL.

Analytics 076/077 ledger checksums match the reviewed intent. Read-only production
catalog comparison as `tullyelly_admin` matched all 32 expected columns and 24
constraints in `scripts/release-db-schema.json`, including normalization used by
the runtime readiness check. The enabled admin analytics allow grant is present;
all five archive tables have application-role SELECT/INSERT/UPDATE/DELETE grants.
These are permission observations, not executed writes or a live collector test.

The separate `releases/analytics-state.json` intent enables collection. Its
existing readiness record and protected staging checks remain required; this
schema record does not authorize an agent to collect data. This investigation
has not refreshed that intent, tested production provider credentials, exercised
scheduled writes, proved alert delivery, or changed the recovery limitations in
the [analytics handoff](analytics-production-handoff.md). Those remain explicit
release acceptance items. Source/schema compatibility does not establish all
runtime configuration or external-service behavior.

The proposed record defers SQL execution and attests the reviewed application
compatibility only. The guard implementation, exact-baseline/diff binding, fresh
merged-SHA CI, analytics checks and human production gate remain intact. A later
production baseline or guarded database-file change invalidates this review.

## Manual DataGrip verification; no corrective SQL required

Use the existing development connection first, then the existing production
connection. Confirm the branch/host against the existing connection properties;
do not change URLs, create a connection or retrieve credentials. In each console,
execute this complete read-only block and retain the non-secret results:

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_database() AS database, current_user AS role,
       current_setting('transaction_read_only') AS read_only;
SELECT conname, convalidated, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'dojo.homie_tcdb_snapshot'::regclass
  AND conname = 'homie_tcdb_snapshot_difference_sign_check';
SELECT count(*) AS total,
       count(*) FILTER (WHERE NOT (
         (ranking = 1 AND difference >= 0)
         OR (ranking <> 1 AND difference < 0)
       )) AS invalid_sign,
       count(*) FILTER (
         WHERE ranking = 1 AND difference = -2147483648
       ) AS unrepresentable_positive
FROM dojo.homie_tcdb_snapshot;
SELECT filename, checksum, checksum_algorithm, status, applied_at,
       error_message IS NOT NULL AS has_error
FROM dojo.schema_migration
WHERE filename ~ '^(076|077|083|084|085|086|087|088)_'
ORDER BY filename;
ROLLBACK;
```

Expected identity: `tullyelly_db` / `tullyelly_admin`, read-only `on`. Expect the
validated exact sign constraint, zero invalid/unrepresentable rows, and exact
applied 076/077 ledger entries. Row totals can grow through normal application
use. If any relevant schema/ledger state differs, stop and review the new state;
do not execute 088, initialize a ledger, run migration status/verify or fabricate
applied timestamps. After any SQL error, issue `ROLLBACK` to close the transaction.

There are no INSERT/UPDATE/ALTER DataGrip steps for this release. If later evidence
shows missing or different constraints, prepare a separate concrete repair and
ledger review; this document does not pre-authorize a fallback migration.

## Review validation

Documentation checks, changed-file Prettier and Git whitespace checks passed.
The existing compatibility validator accepts the proposed exact binding and still
rejects the old record, a different baseline and any additional SQL diff. The
review branch's guarded database tree matches the failed release exactly. No
migration, collector, database-writing test or release was run. Full application
validation was not repeated for these record/documentation-only edits; the future
merged review SHA still requires its own mandatory GitHub CI.

## WU-1226 compatibility refresh; October 31, 2026

The historical WU-1226 [compatibility record](../releases/deferred-schema.json) bound to
READY production deployment `dpl_GTdhe4WWiRxxwAowbCMGW9xjVxL7`, resolved from
`tullyelly.com`, application SHA `b02bf5c659c0dec985f36e7157d07f0dae2d8280`.
The complete guarded diff from that baseline contains only migration 089; its
exact diff SHA-256 is
`a93e05acca4b730c3e75a7348627260e9648a9065d2535cfd65a600e8ebceea3`.
The earlier WU-1213 observations above remain historical evidence.

James reports successful execution of 089 in existing development and production.
Read-only membership postflight assertions subsequently passed on both branches.
This is an additive data backfill, with no schema or application-contract change.
Both 089 ledger rows remain absent; application compatibility does not establish
ledger verification. The [Raptors record](raptors-membership-backfill.md#applied-execution-and-ledger-reconciliation)
provides the exact file hash, verified effects and James-only ledger handoff.
No migration, ledger write or deployment was executed by Cipher.
