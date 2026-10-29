# Analytics migration-file handoff

Prepared against checkout `193cda3b767f8a390d838ad6b403160f637742c5` on
2026-10-29. This package contains only ledger initialization, the unchanged bodies
of migrations 076/077 with atomic ledger inserts, and read-only assessment SQL.
No new forward migration is justified by the observed analytics state. Category
and membership migrations are outside this package. Nothing here authorizes
production writes, application deployment or collection activation; preserve the
existing [production approval policy](production-releases.md) and
[DataGrip procedure](analytics-neon-setup.md).

## Current analytics database policy

James executes reviewed SQL manually through existing DataGrip connections,
development first and production only after development validation and fresh
production checks. Cipher and delegated agents stay read-only through all routes.
No branch, connection, URL or environment-file changes are permitted. Preserve
write-suite guards and leave database-writing tests unrun; James operates feature
checks. See the full [operating boundary](analytics-neon-setup.md#analytics-database-operating-boundary-wu-1205-amendment).
Application release and human approvals remain unchanged; no analytics SQL
executor is dispatched and no mandatory new recovery environment is introduced.

## Independent development and production assessment; 2026-10-29

Read-only SELECTs inspected each existing branch independently in Neon project
`rough-bush-94516855`, database `tullyelly_db`, as `tullyelly_admin`.
Endpoint metadata was read without retrieving credentials or changing settings.

| Target      | Branch                      | Existing direct endpoint   |
| ----------- | --------------------------- | -------------------------- |
| Development | `br-crimson-fog-ae22ws22`   | `ep-flat-cherry-aepuz1d0`  |
| Production  | `br-withered-snow-aea0yck6` | `ep-jolly-flower-ae4bmy06` |

Both endpoints use suffix `c-2.us-east-2.aws.neon.tech`. The service reports
pooler_enabled=false on both endpoints; this does not establish the hostname in
an existing app connection string or its effective deployed binding. Do not
retrieve URLs or assume the deployed app uses the branch's direct host.

| Comparison against selected files        | Development observation                                            | Production observation                                                |
| ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 076 tables/identity sequence             | No analytics relations returned                                    | No analytics relations returned                                       |
| 076 columns/constraints/indexes/owners   | Absent with their parent tables; no partial schema found           | Absent with their parent tables; no partial schema found              |
| 077 operational columns/range constraint | Absent with parent tables                                          | Absent with parent tables                                             |
| Ledger                                   | Absent                                                             | Absent                                                                |
| `dojo` owner and schema rights           | `tullyelly_admin`; USAGE/CREATE available                          | `tullyelly_admin`; USAGE/CREATE available                             |
| Authorization ownership                  | Six required authz tables owned by `tullyelly_admin`               | Six required authz tables owned by `tullyelly_admin`                  |
| Required seeds                           | One admin app, one admin role                                      | One admin app, one admin role                                         |
| Analytics feature/grants                 | Zero features, zero grants                                         | Zero features, zero grants                                            |
| Revision and TEMP privileges             | Function EXECUTE, revision SELECT/INSERT/UPDATE and TEMP available | Function EXECUTE, revision SELECT/INSERT/UPDATE and TEMP available    |
| Affected admin users / revision sum      | 1 / 2 at inspection                                                | 1 / 2 at inspection                                                   |
| 076 classification                       | Genuinely absent; owner may apply selected 076                     | Genuinely absent; production execution held pending development       |
| 077 classification                       | Genuinely absent; requires successful 076 first                    | Genuinely absent; requires successful 076 and fresh production checks |

The independently retrieved prerequisite definitions matched for the inspected
subset: 41 columns, 17 validated constraints, two revision functions and three
non-internal triggers per target. This is not a claim that the whole databases
are equivalent. In each target:

- App/role/feature IDs are generated-always BIGINT identities. App slug, role name
  and feature key are unique. Role-feature primary key is `(role_id,feature_id)`;
  required FKs and allow/deny check are validated.
- Membership app_id is NOT NULL. The migration's global-membership clause
  matches no rows here; existing app-scoped behavior needs no repair. No new
  memberships are added by 077.
- `authz_bump_revision(uuid)` and `authz_get_revision(uuid)` belong to
  `tullyelly_admin`, use invoker security and have no function settings.
  The bump function returns 0 for null, inserts revision 1 when missing and
  increments an existing revision by 1; it does not notify itself.
- Enabled audit-stamp triggers exist on feature, role-feature and membership
  tables. No generic revision trigger was returned for those tables or policy
  revisions. Preserve 077's explicit bump and `pg_notify('authz_changed',...)`
  in the same transaction.

The 077 bundle temporarily captures affected users' revisions, checks exact
increments and the enabled admin feature/allow grant before commit. Concurrent
authorization changes can abort that assertion; investigate rather than relaxing
it. No user IDs are exported. Catalog evidence proves definitions and current
prerequisites, not SQL execution, trigger effects or notification delivery.
Those remain James-operated development checks, followed by read-only review.

No forward repair is currently justified on either target. The absent ledger
requires deliberate initialization and only actual selected-file execution rows;
it proves nothing about earlier domain migrations.

## Exact existing-development DataGrip order

James uses his existing development DataGrip connection first, and later his
existing production connection. Both must target `tullyelly_db` as
`tullyelly_admin` with TLS; no new connection or URL change is requested.
Match Host to independently confirmed Neon project/branch/endpoint metadata;
SQL names cannot distinguish production from its clones. Start with DataGrip's
Read-only setting enabled, no open transaction, and stop-on-error execution.
Let each file's explicit BEGIN/COMMIT own its transaction; never wrap all files
in another transaction. Execute entire files, not highlighted fragments. Never
run a generic apply-all command.

1. In the existing **development** connection, run [00_read_only_preflight.sql](../db/operations/analytics/00_read_only_preflight.sql).
   Expect read_only=`on`, the intended database/role, absent analytics and ledger,
   exactly one admin app and role, zero analytics features/grants, and prerequisites
   matching the assessment. Review catalog ownership, identities, columns,
   validated constraints, function bodies and triggers. If a ledger now exists,
   inspect it using [analytics-ledger.sql](../db/diagnostics/analytics-ledger.sql)
   and compare its structure to `ensureMigrationLedger`; do not execute step 2
   against an existing ledger. Any unexplained difference stops this package.
2. After the approved write window, turn off the connection's Read-only option
   deliberately and run [01_initialize_ledger.sql](../db/operations/analytics/01_initialize_ledger.sql)
   only if the ledger is absent. It creates exactly the existing ledger/index,
   with no historical rows. The table owner is the executing application role.
3. Run [076_apply_with_ledger.sql](../db/operations/analytics/076_apply_with_ledger.sql).
   It executes the original 076 body and records its original hash in the same
   BEGIN/COMMIT transaction. Check the successful COMMIT before continuing.
4. Run [077_apply_with_ledger.sql](../db/operations/analytics/077_apply_with_ledger.sql).
   It requires exact applied 076 ledger proof and the reviewed absent-feature
   state, executes the original 077 body, checks grants/revision changes and
   records its original hash in the same transaction.
5. Restore DataGrip's Read-only option. Run
   [90_read_only_postflight.sql](../db/operations/analytics/90_read_only_postflight.sql).
   Both `columns` and `constraints` comparisons must return true against the
   existing `scripts/release-db-schema.json` contract. Require two selected
   applied ledger rows with the original hashes below, algorithm `sha256`,
   non-null timestamps, measured execution durations and no error; the feature
   must be enabled on admin with the admin allow grant. Review function definitions
   again. The general [catalog diagnostic](../db/diagnostics/analytics-schema.sql)
   also exposes indexes and trigger details for retained before/after comparison.

All three write files check database/role and take a transaction-scoped advisory
lock using the existing `cipher:schema-migrations` key. They release it on commit
or rollback, including errors; do not run another executor/operator concurrently
between files. The legacy runner does not honor this lock. Each file is atomic;
an error in 077 leaves committed 076 intact. Roll back an aborted transaction.
If commit acknowledgement is lost, read schema and ledger before considering any
retry. An existing selected ledger row deliberately aborts replay. Existing
matching rows may be skipped only after review of schema and checksum evidence;
partial state or a mismatching/failed row needs a revised handoff.

Production also requires current deployment-bound disabled-collection evidence,
reviewed compatibility and documented backup/recovery coverage and accepted
limitations before approval. No mandatory isolated restore proof or new recovery
environment is introduced. This handoff supplies none of those by
implication. Stop for wrong/unknown host, checksum change, partial schema,
missing prerequisites, unexpected feature/grants, ledger drift, concurrent writes,
lock/timeouts, expired recovery or unaccepted recovery limitations. Never restore/reset
production or automatically reverse migrations.

## Checksums

The original files remain byte-for-byte unchanged. Ledger rows identify these
original files, not the operational bundles:

| Original file                      | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `076_create_analytics_archive.sql` | `0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553` |
| `077_analytics_operations.sql`     | `88584aa867075149dc0b7d1b984262443462493c0e446fb8c00122446128f694` |

Verify originals and handoff files from the repository root:

```bash
sha256sum db/migrations/076_create_analytics_archive.sql db/migrations/077_analytics_operations.sql
sha256sum -c db/operations/analytics/SHA256SUMS
```

[SHA256SUMS](../db/operations/analytics/SHA256SUMS) binds every operational SQL
file, including preflight and postflight. Review that manifest with the exact
checkout; it is an integrity record, not evidence of database execution.
Ledger initialization has no numbered migration record because it is runner
bookkeeping, not an invented historical migration. After success the ledger
contains only the individually justified analytics rows, unless previously
reviewed rows already existed. Older unrecorded migrations remain unresolved.
Global runner verify and the existing analytics release executor will still reject
unreconciled history; do not mark unrelated files applied to satisfy them. This
SQL package does not deploy code or declare the protected analytics workflow ready.

## Manual evidence to return and production hold

The new policy supersedes the earlier replacement-branch/env-file handoff. No
branch, connection or environment file is created, changed or requested. James
executes the numbered SQL steps above through existing development DataGrip.
Cipher subsequently repeats read-only catalog/ledger comparisons and records
results. SQL bundle execution and write-producing validation are **pending**
until James reports completion and read-only evidence confirms the effects.

Record successful COMMIT for each write file, both postflight comparison booleans,
the two selected ledger rows and grant/revision assertion results, without URLs,
credentials or user payloads. Report completion to Cipher; it verifies read-only.
If the affected set is still one member and no independent authorization changes
occurred, revision sum should rise from the fresh preflight value by one. Use
actual fresh values rather than hardcoding the earlier sum.

After schema postflight, James may use his existing development app to check
owner access, denied non-owner access and the read-only connection control. He
starts the server. Collection/repeat/import checks are owner-operated only,
bounded to an exact completed UTC day within the confirmed reporting window;
credentials, direct-connection compatibility and unavailable history must be
resolved first. Cipher must not press controls, log in, seed/clean data or trigger
requests that write. Do not run rollback fixtures against shared development.
Mocked regressions cover failure/zero/gap/interruption without corrupting shared
data; the broader bounded feature checklist belongs to WU-1212.

For a notification check, James can use an existing development DataGrip console
with LISTEN before manually executing 077 and record whether the commit produced
`authz_changed`, omitting user-ID payloads from shared evidence. The bundle
asserts exact affected revision increments before commit. Cipher reads resulting
metadata; it does not open a write-producing test harness. A read-only catalog
cannot prove listener delivery.

Production files are prepared artifacts only. Do not execute production SQL yet.
After development results are verified read-only, Cipher refreshes production
preconditions and selected-file classification independently and provides the
final handoff for James under WU-1213. Successful dev execution is not production
proof. Existing application release/human approvals remain required; no database
executor is dispatched.

## Validation evidence

Under the current policy the disposable PostgreSQL suite is **unrun**; its
existing isolation guards remain unchanged. No 076/077 SQL, grant, revision or
ledger write has been executed by Cipher in either environment. Human-run dev
execution, feature checks, notification delivery and production execution remain
pending. No test is counted as a live pass merely because a guard skipped it.

The earlier database-disabled local baseline passed in 117.9 seconds: 241 suites
and 1,896 tests passed; 2 suites and 6 opt-in tests were skipped, including the
3 analytics PostgreSQL tests. Coverage/build passed. This is dated mocked/build
evidence from the prior handoff, not proof of SQL execution or this policy's
manual steps. Current focused checks are recorded separately after the amendment.

Current policy-amendment checks: four fixture-only suites passed all **67 tests**
(`analytics-archive`, `analytics-operations`, `analytics-test-target`, `release-db`)
with `SKIP_DB=true` and live-write opt-ins unset. The sandboxed attempt failed at
Next/TypeScript subprocess setup; the identical safe checks passed outside the
sandbox. No PostgreSQL integration suite or rollback fixture was run. Documentation,
explicit changed-file Prettier, original-body/hash placement and checksum-manifest
checks passed. No full-baseline pass is newly claimed for this amendment; the
prior completed baseline is recorded above and has not been repeated.
