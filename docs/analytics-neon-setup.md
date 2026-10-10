# Analytics: manual Neon branch and DataGrip setup

This is the prerequisite for the [analytics rollout](analytics-rollout.md).
Neon is confirmed as the provider. The production project/branch and the existing
schema/ledger are **not yet verified**. No database connection, migration, seed or
live Vercel query has been run for this setup. Keep collection disabled.

## 1. Identify production without sharing credentials

In Vercel, open tullyelly.com's project settings, Environment Variables, and
privately inspect the **Production** DATABASE_URL. Note only the host, database
and role; do not copy the password, full URL or analytics token into chat.
Do not edit the variable or deployment connection. Compare that host with your
existing DataGrip production data source's Host field. Local .env.local is only
a candidate; it does not prove the deployed application's database identity.

In the Neon Console, open each candidate project and its Branches view. Select
a branch, then **Connect**. Match the hostname to Vercel Production. Pooled
hosts have `-pooler` before the first dot; compare the underlying compute endpoint
with the direct host too. A branch's name/default label alone does not prove it is
production. Record the matching Neon project name/ID, branch name/ID, direct host,
database and role. Neon branch IDs start with `br-`; compute hosts start with `ep-`.
If no branch matches, stop and check the Vercel environment/project selection.

The repository expects the application database/role names `tullyelly_db` and
`tullyelly_admin`. This does not identify a branch: several branches can contain
the same names. Do not replace these with neondb/neondb_owner or bypass guards.

## 2. Create dev/analytics manually

1. In the identified Neon project, open Branches and choose New branch.
2. Explicitly select the confirmed production branch as parent. Name the new
   branch **dev/analytics**. Choose **Current data** so the schema, existing ledger
   and authorization prerequisites can be assessed as they currently exist.
3. Check the branch expiration setting. Give it enough time for this work or
   explicitly turn off automatic deletion; record when you will remove it.
4. Create the branch and its compute. Record its new branch ID and **direct**
   hostname from Connect, with database tullyelly_db and role tullyelly_admin.
   The direct test endpoint must differ from production. Do not set it as default,
   promote it, reset production or connect it to Vercel.
5. Keep copied production data private on this isolated branch. The setup/audit
   reads schema metadata only; do not export application/authentication rows.

A Neon branch inherits the parent's databases and roles; renaming the database
is unnecessary. Current-data branches are isolated snapshots of the parent at
creation. See Neon's [branch instructions](https://neon.com/docs/manage/branches).
There is no automatic preview branching in this feature.

## 3. Make a separate DataGrip connection

Add a **new PostgreSQL data source**, named `tullyelly DEV ANALYTICS`. Use the
new branch's direct host, port 5432, database tullyelly_db and role tullyelly_admin.
Enter its password privately in DataGrip. Require SSL using the connection
settings from Neon; use certificate verification where supported. Do not edit
or repoint your existing production data source.

Enable DataGrip's Read-only option during assessment, label/color the connection
clearly, and choose only this database for introspection. Open a console attached
specifically to `tullyelly DEV ANALYTICS`. Run the read-only
[analytics-schema.sql](../db/diagnostics/analytics-schema.sql). The first result
must show the intended database/role and read_only=`on`. Match DataGrip's Host
field with the test branch's Connect panel; SQL database/role names alone cannot
prove a Neon branch. If anything differs, stop.

If the `ledger_presence` result is non-null, run
[analytics-ledger.sql](../db/diagnostics/analytics-ledger.sql) in the same console.
If it is null, record **ledger absent** and do not run that second file.
Neither script initializes a ledger or selects application rows. Export the
schema/ledger metadata privately for review; report filenames instead of pasting
private data. DataGrip's read-only checkbox is an extra guard; explicit READ ONLY
transactions supply the database enforcement. See
[JetBrains connection settings](https://www.jetbrains.com/help/datagrip/configuring-database-connections.html).

## 4. Use the exact isolated local environment file

Create **.env.analytics-test.local** in the repository root. `git check-ignore
.env.analytics-test.local` prints that exact filename; the file is ignored.
Leave existing .env.local and .env.test untouched for now. Populate secrets only
in your local editor, never in chat or tracked examples:

```dotenv
# Both URLs are the SAME direct dev/analytics connection copied privately from Neon.
DATABASE_URL=<private direct dev/analytics URL; sslmode=require or verify-full>
TEST_DATABASE_URL=<the identical private direct dev/analytics URL>

# Non-secret metadata copied independently from Neon, not guessed from URL names.
ANALYTICS_TEST_PROJECT_ID=<Neon project ID>
ANALYTICS_TEST_BRANCH_ID=<dev/analytics branch ID>
ANALYTICS_TEST_BRANCH_NAME=dev/analytics
ANALYTICS_TEST_HOST=<direct test hostname>
ANALYTICS_TEST_DATABASE=tullyelly_db
ANALYTICS_TEST_ROLE=tullyelly_admin
ANALYTICS_PRODUCTION_BRANCH_ID=<confirmed production branch ID>
ANALYTICS_PRODUCTION_HOST=<confirmed production direct hostname>
ANALYTICS_TEST_CONFIRMED=false

NODE_ENV=test
VERCEL_ENV=development
ANALYTICS_SYNC_ENABLED=false

# Optional until live Vercel verification is configured securely:
ANALYTICS_VERCEL_TOKEN=
ANALYTICS_PROJECT_ID=
ANALYTICS_TEAM_ID=
ANALYTICS_AVAILABLE_FROM=
CRON_SECRET=
```

ANALYTICS_TEST_PROJECT_ID is the **Neon** project; ANALYTICS_PROJECT_ID is the
**Vercel** project. They are different settings. Only set
ANALYTICS_TEST_CONFIRMED=true after matching the console, DataGrip and local URL
host/database/role, and confirming the test branch ID differs from production.
This flag records human confirmation; it cannot look up branch identity in Neon.
Send only those non-secret identifiers and confirmation that the local file is
ready. The agent must compare them before connecting.

Actual repository loading behavior:

| Tool                           | Environment loading / database behavior                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration runner               | DOTENV_CONFIG_PATH, default .env.local; DATABASE_URL takes precedence; status/verify can initialize the ledger                               |
| Next app                       | .env.local automatically; .env.analytics-test.local requires explicit process loading, never a Vercel connection edit                        |
| Playwright app suite           | .env.test; prefers TEST_DATABASE_URL; pretest seed reloads .env.test with override=true and writes data                                      |
| Playwright application server  | Sets E2E flags; shared pool uses limited stub reads, so it does not prove analytics SQL integration                                          |
| Analytics PostgreSQL Jest test | Explicit TEST_DATABASE_URL plus target metadata, opt-in ANALYTICS_INTEGRATION_CONFIRMED=true; uses real PostgreSQL and fixture API responses |
| Normal Jest / Vitest           | Fixture tests; not proof of a real database or live Vercel API                                                                               |
| Chart browser checks           | Isolated client bundle; no app server, env file or database                                                                                  |

Do not run npm run test:e2e or its seed step until .env.test is separately
verified and intentionally configured. The existing seed currently logs its full
connection URL; do not capture/share its output. This feature does not use that
seed for database validation. Do not set CI=true or NODE_ENV=production to get
around a test safety guard. The agent does not start the dev server.

After metadata confirmation, these **Bash** commands use only the new file:

```bash
# No DB access; validates explicit metadata, different branch/endpoint and TLS.
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=test VERCEL_ENV=development DOTENV_CONFIG_PATH=.env.analytics-test.local \
  npx tsx -r dotenv/config scripts/analytics-test-preflight.ts check

# Read-only access to the confirmed test branch; no ledger initialization or migrations.
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=test VERCEL_ENV=development DOTENV_CONFIG_PATH=.env.analytics-test.local \
  npx tsx -r dotenv/config scripts/analytics-test-preflight.ts inspect
```

Expected check output: `Confirmed local metadata:` with only project/branch/host/
database/role, then `No database connection made.` The inspect command must print
`Read-only assessment saved to cipher/analytics-test-preflight.json; no migrations
or ledger writes performed.` That output directory is ignored and the file is
created with private permissions. Stop for metadata mismatch, same production
branch/endpoint, missing TLS, URL guard rejection, connectivity or catalog errors.
The script never prints raw driver errors/URLs. No migration command is needed
to obtain this first report.

After reviewing the report and preparing schema/ledger on this branch only, run:

```bash
env -u DATABASE_URL -u TEST_DATABASE_URL \
  NODE_ENV=test VERCEL_ENV=development DOTENV_CONFIG_PATH=.env.analytics-test.local \
  ANALYTICS_INTEGRATION_CONFIRMED=true \
  node -r dotenv/config node_modules/jest/bin/jest.js --config jest.config.cjs \
  --runInBand __tests__/analytics-postgres.integration.test.ts
```

Expected: three passing integration tests, not three skipped tests. The tests
verify actual SQL fixtures, two connections/advisory exclusion, bounded import
continuation, duplicate replacement and the public SQL projection. They write
only uniquely named fixture projects and clean those up; SQL fixtures roll back.
They do not prove live Vercel compatibility. Optional token settings can stay blank
for these fixture-API tests. Live API verification remains pending until a test
Vercel project/token is securely configured.

## 5. Assess the actual schema, then reconcile individually

The preflight matches recorded checksums but deliberately marks schema assessment
as `needs_per_migration_review`. A missing ledger row means **unrecorded**, not
necessarily unapplied. The report cannot reconstruct historical data mutations
from the current schema. For every relevant file, review its SQL alongside catalog
definitions, constraints, triggers, owners and required stable-key seed rows.
Use a review table with filename, repo SHA-256, ledger state, observed evidence,
classification and proposed action:

| Classification                       | Evidence and action                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorded and consistent              | Existing applied ledger checksum matches exact file; verify current prerequisites; leave row unchanged                                                                                    |
| Existing but unrecorded              | Every current effect is independently verified or a documented equivalent baseline is explicitly approved; record only that reviewed file with its exact checksum and baseline evidence   |
| Genuinely pending                    | Required effects absent, prerequisites proven, SQL/data effects reviewed; execute only the approved file and record its exact checksum                                                    |
| Ambiguous / partial / superseded     | Object presence alone insufficient, data mutation unknowable, older definitions superseded or incomplete state; stop, investigate and prepare a separate forward repair/baseline decision |
| Drift / failed / unknown ledger file | Never overwrite checksums or treat failed as applied; resolve separately before proceeding                                                                                                |

Do not mark all files applied. Later views/functions can supersede earlier
migration effects; that does not prove an older SQL file ran. Historical seed,
update and delete migrations need evidence beyond a table existing. The known
065 seeded identifier and older data/menu/authz migrations must not be replayed
blindly. Use current schema mirrors as corroboration, not historical execution
proof. If a baseline-equivalence decision is needed, document it explicitly with
reviewer/time/evidence; do not invent an original application date.

For analytics: 076 is genuinely pending only if all five archive tables are absent
and dojo/tullyelly_admin exist. Any existing subset is ambiguous. 077 is pending
only after the 076 schema is verified and its run/progress additions are absent;
check admin app/role, revision function and feature state too. Schema readiness
alone does not establish capability seed correctness. Assess these facts on the
test branch before preparing production SQL. No assessment has been performed yet.

## 6. Keep DataGrip for the eventual human production operation

Production changes remain human-operated and require the test proof first.
Use a dedicated, clearly labeled production DataGrip console only at that stage.
Privately recheck the host/branch against Vercel and Neon, with collection disabled.
Capture a fresh Neon history/checkpoint time and schema/ledger snapshot. Confirm
actual plan retention in Backup & Restore; test creating/opening a recovery branch
from that point before relying on it. Do not assume a fixed history duration or
restore production as a test. See Neon
[history retention](https://neon.com/docs/postgres/backup-restore/history-window)
and [restore documentation](https://neon.com/docs/postgres/backup-restore/branch-restore).

If the ledger is absent, first approve only the exact initialization DDL owned by
ensureMigrationLedger in db/schema-migrations.ts. This creates dojo.schema_migration
and its index, not domain tables. Review/run that DDL deliberately in DataGrip;
never run db:migrate:status first assuming it is read-only. Inspect any existing
ledger structure rather than replacing it.

Reconcile only individually reviewed existing files. Calculate each checksum from
the exact checkout, without a DB connection:

```bash
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {createHash} from "node:crypto"; const file=process.argv[1]; console.log(createHash("sha256").update(readFileSync(file)).digest("hex"));' db/migrations/076_create_analytics_archive.sql
```

The same command takes any explicitly selected reviewed filename; do not use a
bulk baseline loop. Once a specific existing migration is proven/approved as an
equivalent baseline, a human can record it in DataGrip using **that file's** hash:

```sql
-- TEMPLATE ONLY: replace placeholders after the per-file review.
-- Before running, verify current_database/current_user and DataGrip's host/branch.
BEGIN;
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
VALUES
  ('<individually reviewed filename>','<exact SHA-256>','sha256','applied',
   CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,NULL);
COMMIT;
```

The timestamp is the documented baseline/reconciliation checkpoint, not a claim
about the date original SQL was executed; execution_ms=0 records no replay. Keep
that interpretation in the private per-file review record. Stop if a row already
exists; compare it, never ON CONFLICT-update a checksum. Do not insert an ambiguous
file just to make verify green. Unresolved history is a rollout blocker.

For genuinely pending 076/077, keep original files unchanged and review them in
DataGrip. The safest ledger-managed execution is the repo runner **only after**
all unrelated history is reconciled and exactly 076/077 are pending; the runner
also retries failed files, so any failed state is a stop condition. If you prefer
manual SQL execution, prepare a reviewed DataGrip bundle for each file: original
SQL between its BEGIN and COMMIT, then the corresponding exact-hash ledger INSERT
immediately before the existing COMMIT. This keeps schema and ledger atomic.
Do not run the SQL first and forget the ledger. Check database/role, absence of
an existing ledger row and expected schema prerequisites before each bundle.
The original repository SQL file/hash remains unchanged; the combined operational
bundle is a private reviewed artifact. Never execute a generated bundle without
review, and never add unrelated pending files to it.

After manual execution, each ledger row must be applied with the exact repo hash;
verify schema constraints/ownership and the admin capability/revision behavior.
The existing guarded runner's status/verify can then be used by the human, with
the approved production environment file, following the rollout guide. Expected
verify output is `Migrations verified. All files are applied and checksums match.`
Stop on every missing/pending/failed/drift state; no SQL/ledger guards are bypassed.
If history remains ambiguous, do not enable collection; prepare a reviewed forward
repair and/or explicit baseline plan after the test-branch assessment.

Final production bundles and ledger reconciliation cannot be finalized until the
actual branch report has been reviewed. No production command was executed here.
