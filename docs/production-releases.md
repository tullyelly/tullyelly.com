# Human-approved production releases

Cipher prepares and tests code-only releases, then deploys the reviewed artifact
through the protected GitHub workflow after a human approves the concrete plan.
Database migrations and credential maintenance are separate explicit operations.
Preparation and this policy do not authorize a production release. Do not approve
the environment gate on the user's behalf. Only the coordinating agent initiates
a release; specialists cannot perform production operations.

## Current readiness

The App-authenticated release-control bootstrap is complete. Parent run
[38175631646](https://github.com/tullyelly/tullyelly.com/actions/runs/38175631646)
and human-approved child
[38175750484](https://github.com/tullyelly/tullyelly.com/actions/runs/38175750484)
succeeded at `b76d534c0dffa2e539670948f6beb331d8d1a9f5`. The approval was recorded
under `tullyelly`; no production operation occurred.

Vercel Git integration is disconnected. Pushes and merges do not automatically
deploy production or previews. No replacement preview workflow is configured;
previews require explicitly approved deployment with verified isolated databases.
The existing production deployment remains `dpl_Ce7A2PmQodC9nsjuNpyD3YbH9hWd`,
at `3fce11932f189d940d72d0a9e3c91a8fd9943faf`, as verified during closeout.

The analytics migration release is not ready. Historical SQL was executed manually;
production ledger reconciliation, current non-production integration, credential
rotation and restore rehearsal remain analytics release prerequisites. Prior catalog
observations must be refreshed before asserting current schema state. The
analytics executor refuses missing ledgers, ambiguous history, checksum drift
and failed entries rather than inserting invented baselines or replaying SQL.

## Safe code-only check diagnostics

Run `38202358849`, production job `114659659761`, stopped in post-approval
checks before staging. Its old catch-all message did not retain the failing guard
or API status, so the precise protected-token failure cannot be recovered from
that log. A read-only local owner CLI replay confirmed a response-contract defect:
the disconnected project omits `link`, while the old check demanded explicit
`null`. Vercel documents [project `link` as optional](https://vercel.com/docs/rest-api/projects/find-a-project-by-id-or-name).
The check now accepts either absent or null links, rejects connected/malformed
links, and retains exact project/team, settings, domain and production checks.

Errors emit fixed guard and API-operation labels, HTTP status, allowlisted network
codes and sanitized validation-field names. Unknown fields are redacted; values,
URLs, headers, provider bodies and arbitrary exceptions are never serialized.
Manifest startup failures follow the same rule. An HTTP failure from a GitHub
approval operation is distinguishable from a Vercel project operation.

The separate local CLI metadata read succeeded and settings matched. That access
is not `VERCEL_RELEASE_TOKEN`; its permissions remain untested independently.
No token retrieval, permission expansion, deployment or retry is authorized by
these diagnostics. A future explicitly authorized gated check must establish the
protected token's actual operation/status if another failure occurs.

Run `38318822912` passed validation, prebuilt verification and post-approval
checks, then failed in the combined deploy step. Its default `production.check`
label and missing CLI process evidence do not identify the failing operation.
Owner CLI reconciliation found no matching staged deployment and unchanged live
aliases; this does not independently establish the workflow token's CLI permissions.

CLI failures now identify stage, promote or rollback and retain only exit status,
allowlisted signal/spawn codes and a fixed process category. Stdout, stderr,
process messages and environment values are never emitted. Staging reconciliation
preserves the original sanitized failure and separately reports not-found or a
failed lookup. A recovered deployment reports the found outcome and original
failure without issuing a second stage. Lookup, identity and health failures have
fixed labels. The restricted deployment environment is unchanged. Diagnostics do
not authorize retries, manual deployment, gate bypass or promotion.

## Ordinary code-only deployment

The existing dispatcher mode `production` now accepts only a strict version-2
`kind: "code-only"` manifest. It invokes `production-release.yml`; there are no
Neon credentials, database connections, SQL statements, migrations, seeding,
analytics imports or password operations in this execution path. Existing application
writes triggered by ordinary users retain their normal behavior; release health
checks use read-only GETs and do not log in, submit forms or invoke collection.
No backup infrastructure, historical ledger reconciliation or credential rotation
is required for a code-only release whose current schema is verified compatible.

### Minimum setup

Keep the existing App metadata variables and `release-dispatch` private key unchanged.
In GitHub **Settings > Environments > production-release > Environment secrets**,
add `VERCEL_RELEASE_TOKEN`. Give it the narrowest available scope to team
`team_pB5TcLa7apLtPAiVrRbcjBG3` permitting inspection, staged production deployment,
promotion and rollback for project `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`. Do not claim a
project-only permission if the current account/token UI does not offer one.
If staged deployments are protected, add `VERCEL_AUTOMATION_BYPASS_SECRET` there.
Neither secret is present in preparation, validation or build jobs. Do not add
`RELEASE_DATABASE_URL` or `NEON_RELEASE_API_KEY` for code-only releases.
Production `DATABASE_URL`, auth and other runtime secrets stay on Vercel and are
never pulled, decrypted or printed by this path. Vercel project metadata reads
verify configuration presence, project/team identity, settings, Git disconnection,
domain assignment and deployment drift. These reads do not independently prove
DATABASE_URL contents; the owner verifies its non-secret target in the dashboard
as part of the schema evidence. No environment setting is modified by the release.

### Reviewed manifest and compatibility evidence

Prepare `releases/<name>.json` on protected main. `scripts/release/code-manifest.ts`
is the strict schema. Required fields:

- `version: 2`, `kind: "code-only"`, `operation: "deploy"`, `commit`: exact reviewed
  application SHA; `collectionEnabled: false`.
- `vercel`: exact project/team, `productionDeploymentId`, `productionHost`, reviewed
  settings and `settingsSha256`. The live domain is `tullyelly.com`.
- `buildEnvironment`: explicit public `NEXT_PUBLIC_*` values only; no secrets.
- `schemaCompatibility`: `checkedAt`, `checkedBy: "tullyelly"`, private-review
  `evidenceUrl`, exact `previousApplicationSha`, confirmed production `databaseHost`
  and `database`, `method`, `requiredObjects`, empty `missingObjects`,
  `compatible: true`, `rollbackCompatible: true`.

Evidence expires after 24 hours and must correspond to both application SHAs.
For `unchanged-database-contract`, review the diff of all database consumers against
previousApplicationSha, including auth, raw SQL, generated clients and dependencies;
record why no new table, column, view, function, grant or semantics is required.
For `read-only-catalog-check`, list required objects and verify them with a clearly
labeled read-only DataGrip production console. Use an explicit read-only transaction;
inspect columns/types, constraints, views/functions and authorization requirements.
Do not use the migration runner, which may initialize the ledger. Missing schema is
NO-GO; never invoke the analytics or maintenance path as a fallback. The evidence is
owner attestation under code-owner review, not an automated live schema test. Release
automation itself never connects to Postgres. Optional analytics archive tables may
be absent only when graceful unavailable states have been verified.

The application SHA must be an ancestor of the dispatch SHA on protected main.
Only reviewed `releases/*.json` metadata may differ; changes to code/dependencies
require a new application SHA and a fresh manifest. Compute manifest SHA-256 over
its exact bytes, for example `sha256sum releases/<name>.json` in Bash. This avoids a
self-referencing commit hash in a manifest. Do not publish an example with invented
compatibility evidence as a runnable release.

### Build, approval and deployment

1. After review/merge, select **Dispatch release as dedicated App**, branch `main`,
   mode `production`, exact application `release_sha`, manifest path and digest.
   This is a separate explicit dispatch authorization, not permission inferred
   from preparing or publishing code.
2. The App starts the child. Existing bot actor/triggering actor, installation,
   dispatcher provenance, protected-main and reviewer checks remain mandatory.
3. Preparation runs repository validation and `vercel build --prod --standalone
--non-interactive` using pinned CLI 63.1.2, reviewed local project settings,
   an empty production env file and an empty authentication home. No `vercel pull`,
   `--yes` build, deployment token, DB URL or production auth secret is supplied.
4. The builder runs with an allowlisted environment. `SKIP_DB=true` is build-only.
   The disposable build checkout temporarily quarantines only the tracked,
   unmodified `.env.example` and `.env.test.example` templates. The pinned Vercel
   builder otherwise packages these templates into functions. Unexpected root
   `.env*` files, modified templates and template symlinks fail before exclusion.
   Originals are restored after success, failure, SIGINT or SIGTERM; the child
   process group is stopped before restoration. An I/O restoration failure retains
   unrecovered originals and fails closed. SIGKILL or runner loss cannot execute
   cleanup; this procedure runs only in a disposable build checkout.
   Distinct auth canaries are scanned out of all output; `.env*` files, runtime
   credential overrides and external symlinks fail artifact verification. Next
   runtime env references remain references; deploy receives neither placeholders
   nor SKIP_DB. Public build-time values must be reviewed because they are baked
   into client output. Unsupported build-time secret requirements are NO-GO.
5. Python validates output and extracts the tar into a fresh directory. Artifact
   checksum and manifest digest are bound to the run; retention is one day. After
   approval, the same safe extraction and verification run on the downloaded bytes.
6. You review the exact SHA, schema evidence, manifest/build digests and previous
   deployment, then approve `production-release`. Never approve on your behalf.
7. The protected step verifies recorded human approval before provider operations,
   rechecks targets and stages `deploy --prebuilt --prod --skip-domain`, using the
   existing Vercel production runtime configuration with an explicit per-deployment
   `ANALYTICS_SYNC_ENABLED=false` override. It binds SHA/manifest/build metadata.
8. Staged GET checks cover `/`, `/shaolin`, `/stats`, unauthorized cron access and
   owner-admin authorization. There is no authenticated cron request or import.
   Manually validate a representative database-backed page and owner/non-owner reads
   before the first release approval; automated page checks alone do not prove all
   schema contracts. Recheck drift immediately before promoting the exact ID.
9. Verify public health and record new and previous IDs. Provider write failures
   are inspected using authoritative deployment identity or domain assignment;
   no blind write retries, duplicate stages or automatic recovery are performed.

Owner-admin denial can be an HTTP redirect or Next.js's streamed login redirect
inside an HTTP 200 document. The health reader validates the framework's exact
`__next-page-redirect` refresh marker on the checked origin, with only `/login`
and `/api/auth/signin` destinations. It never follows the login URL. Ordinary
200 admin content, private analytics sections/controls, marker examples in comments
or raw-text elements, malformed/additional refreshes, userinfo, fragments, other
hosts and HTTP downgrades fail. The actual HTTP status is preserved; recognizing
a streamed denial does not turn the response into a synthetic HTTP redirect.
Fixtures use the installed Next renderer that generates the real marker.

Public health checks accept one HTTPS redirect from `tullyelly.com` to
`www.tullyelly.com` with the exact path and query preserved. Both aliases must
belong to the approved project and current expected deployment before and after
promotion. HTTP downgrades, other hosts/ports, userinfo, fragments, changed
paths/queries and additional domain redirects fail closed. Owner login redirects
are inspected on the actual checked origin and never followed. Staged reads stay
on the exact API-verified deployment URL; they cannot fall back to production.
Automation bypass credentials are sent only to that staged URL, never to either
public domain or a redirect destination. All requests omit ambient credentials.

A staged production deployment uses the production database. Keep analytics disabled
and do not browse mutation flows during staging. Provider-triggered cron remains
safe because the collection switch is false. Regular traffic may still write data;
code-only refers to the release operations, not globally read-only application use.

### Separately approved rollback

Use a new version-2 manifest with `operation: "rollback"`. `commit` is the reviewed
executor/application code on main; `vercel.productionDeploymentId` is the deployment
currently serving traffic. Add `rollback.deploymentId`, exact `applicationSha` and
`collectionDisabledVerified: true`. The owner verifies retained deployment analytics
configuration without sharing secret values. Refresh schema evidence to show the
rollback code works with the current database. Rollback does not build or deploy
new application bytes and never restores a database or reinstalls credentials.

Dispatch through the same App `production` mode and obtain a fresh human gate
approval. Identity, readiness, target and live drift are checked before the single
`vercel rollback <exact-id>` operation. Check public health afterward. Vercel plan
limits and deployment retention may restrict rollback targets; verify eligibility
before approving a release. Never automatically roll back on failed health checks.
The original known-good deployment may lack analytics routes; rollback checks public
home/Chronicle reads rather than requiring features introduced by newer code.

### Separate inactive paths

Dispatcher mode `analytics` selects `analytics-release.yml` and
`scripts/analytics-release.ts`, retaining the original version-1 migration manifest,
ledger checks, backup evidence and separate credentials. Mode `maintenance` retains
the existing credential-maintenance path. Neither is invoked by code-only deployment
or rollback, and neither is authorized by code-only approval. All production paths
share the existing non-cancelling production concurrency group.

Local portability rehearsal evidence: CLI 63.1.2 built the actual application in
an isolated source copy with an empty authentication home and no DB/deployment
credentials. The complete source directory was renamed out of reach while a
checksum-bound tar was extracted into another empty directory and verified.
Eight function descriptors had no runtime env overrides; all 205 symlinks stayed
within output. Build credential canaries were absent; compiled SKIP_DB checks
remained runtime environment reads. The uncompressed artifact was 1,284,864,000
bytes; upload compression is handled by GitHub artifact storage. This proves local
packaging and inspection, not live provider deployment or runtime secret attachment.

The first clean Actions checkout failed at `code.artifact-env-file` because the
builder packaged the two tracked env templates. The corrected build-context
rehearsal used Node 22.20.0, CLI 63.1.2, locked dependencies and reviewed public
settings in an isolated clone of `fc64135469b71cfbfa6519b367a492915dd692d0`
with only the proposed build correction. The real builder and strict validator
passed; both originals were restored byte-for-byte. Eight function descriptors
contained no env files. Checksum-bound extraction also passed with the original
source path unavailable. The archive was 1,278,504,960 bytes, SHA-256
`f1c9074e52ee29941a90462f63081d88598f453ad82af885418a7f54734b57d7`.
This is local build evidence, not deployment authorization or live runtime proof.

Official CLI build documentation and installed 63.1.2 help support `--standalone`;
the flag alone is not portability evidence. The output/extraction checks and actual
clean-directory build rehearsal establish local portability. Artifact errors expose
only allowlisted invariant names; arbitrary exception details and file contents are
omitted. Live Vercel environment
attachment, staging, promotion and rollback still require an approved first run.
See [build](https://vercel.com/docs/cli/build),
[deploy](https://vercel.com/docs/cli/deploy) and
[rollback](https://vercel.com/docs/deployments/rollback-production-deployment).

## Credential-only maintenance

[Protected credential maintenance](credential-maintenance.md) owns the separate
password replacement and recovery path. It uses reviewed executor and deployed
application SHAs, the existing App dispatcher and human production gate, and no
SQL migrations or migration-ledger writes. Maintenance credentials are distinct
from a read-only Neon release key. Its consumer inventory, isolated rehearsal,
credential scope and backup prerequisites are not yet proven by fixture tests.
Use that procedure before analytics rollout; never run migrations 076/077 merely
to rotate an exposed password. The implementation does not authorize execution.

## Analytics migration release account setup (separate path)

The account owner completes authentication and protection setup securely in
GitHub/Vercel. These are prerequisites, not authorization to release analytics.

1. In repository **Settings > Environments**, create `production-release`.
   Add `tullyelly` as a required reviewer, enable **Prevent self-review**, and
   disable administrator bypass. Select custom deployment branches; allow only
   branch `main`, with no tags or wildcard patterns. Cipher must dispatch through
   an identity different from the human approver. If the account cannot enforce
   these protections, stop; do not replace approval with a boolean input.
2. Keep production credentials exclusively in that environment's secrets:
   `RELEASE_DATABASE_URL` (direct production Neon URL), `NEON_RELEASE_API_KEY`,
   `VERCEL_RELEASE_TOKEN`, and, if protection requires it,
   `VERCEL_AUTOMATION_BYPASS_SECRET`. Never place them in repository-wide secrets,
   unprotected organization secrets or build jobs. MCP authentication does not
   authenticate Actions or the Vercel/Neon CLI.
3. Verify the workflow GitHub token can read environment protection, effective
   branch rules and repository metadata. Those permissions have not been proven
   by the MCP connection. Stop if the gate cannot inspect them; do not invent
   a substitute approval token or bypass the check.
4. Strengthen `main-fundamentals`: require reviewed pull requests, at least one
   human approval, stale approval dismissal, review of the last push and required
   CI checks. Protect workflow, executor, manifest parser and dependency changes
   with code ownership/review. The verified ruleset requires one approval, strict CI, code-owner and last-push
   review, with no bypass actors. Recheck before each release; a
   `protected: true` branch flag alone is insufficient evidence of review.
5. Approve the separately presented Vercel Git-disconnection change before any
   merge that could publish this feature. Keep deployment hooks disabled and
   audit other credentials/automation that can bypass the gate. The release
   workflow verifies the Git link is absent; it does not silently disconnect it.
6. Verify preview `DATABASE_URL` and any `TEST_DATABASE_URL` point to confirmed
   non-production branches. Require `ANALYTICS_SYNC_ENABLED=false` in previews.
   Staged production deployments still receive production credentials; their
   collection switch must be immutably overridden to false. Existing comment
   email and other mutation routes can still have side effects; automation must
   use read-only smoke checks, never submit comments or owner mutation forms.

## Preparing the exact analytics migration release

The initial analytics workflow accepts only migrations
`076_create_analytics_archive.sql` and `077_analytics_operations.sql` in order.
It cannot perform historical reconciliation. That plan needs per-file schema and
data-effect evidence, exact checksums, reviewed missing changes and its own
protected execution path. Do not use the legacy apply-all runner on production
to bypass this restriction or concurrently with the new release executor.

After reconciliation and rehearsal, Cipher prepares a release JSON under
`releases/<name>.json` on reviewed `main`. Bind it to the exact 40-character
application commit, exact migration SHA-256 values, Neon target, current Vercel
production deployment, reviewed build settings, verified preview isolation and
fresh backup/recovery evidence. The manifest can be committed after the
application commit; only release JSON metadata may differ between them. This
avoids a self-referential commit hash. No placeholder manifest is releasable.

Neon target discovered read-only:

| Property                             | Value                                                 |
| ------------------------------------ | ----------------------------------------------------- |
| Project                              | rough-bush-94516855; tullyelly.com                    |
| Production branch                    | br-withered-snow-aea0yck6; production                 |
| Direct production host               | ep-jolly-flower-ae4bmy06 + DNS suffix below           |
| Expected database                    | tullyelly_db / tullyelly_admin; confirmed by the user |
| Current Vercel production deployment | dpl_Ce7A2PmQodC9nsjuNpyD3YbH9hWd                      |
| Current deployed commit              | 3fce11932f189d940d72d0a9e3c91a8fd9943faf              |

Vercel's production database host, database and role were confirmed by the user.
The password accidentally pasted in chat must be rotated securely before analytics release;
Cipher did not record or use it. A Neon branch named production does not prove Vercel uses
it. Actions verifies authoritative Neon endpoint metadata and SQL database/role
identity again after approval. The collector requires direct connections for
session advisory locking; pooled transaction connections are refused.

## Analytics migration approval and execution

Cipher presents the exact commit/PR, manifest digest, migrations, targets,
verification, configuration changes, stop points and recovery evidence before
dispatch. The human's routine action is:

**GitHub > Actions > Approved analytics release (explicit only) > the prepared run > Review
deployments > select production-release > Approve and deploy.**

Do not approve a run with missing or materially changed evidence. Cipher must
present a revised release if the plan changes. No release is dispatched now.

The workflow prepares a database-free validated build without production
credentials, then waits at the environment gate. After approval it checks refs,
manifest, targets, settings, environment isolation and deployment drift; obtains
the database release lock; applies only approved SQL with atomic ledger writes;
verifies schema; stages the prebuilt production artifact with collection disabled;
checks read-only routes and disabled cron; rechecks drift; promotes; and verifies
the production domain. No migration runs during builds or application startup.

Migration failure stops deployment. A schema-plus-ledger transaction rolls back
that file; previously completed forward migrations remain. Reruns verify exact
hashes and resume without reapplying completed files. A deployment failure leaves
the old production alias in place until promotion. After promotion, application
rollback means assigning the previously reviewed deployment; it does not undo
schema. Never automatically restore/reset production or run reverse migrations.

## Recovery and analytics activation

Neon reports `history_retention_seconds=86400` and no scheduled snapshots for this
project. Verify the actual restore interval, create a retained pre-release recovery
checkpoint through the separately approved workflow, and rehearse restoration to
an isolated branch before approving writes. Retention metadata alone is not a
successful restore test or an indefinite backup. Record the checkpoint ID,
timestamp, accessible restore procedure and responsible owner. Stop if it cannot
be recovered or will expire before the release/recovery window ends.

The first analytics release explicitly leaves collection disabled. Read-only
owner connection testing follows promotion. Enabling collection, redeployment,
manual collection and historical import scope require a subsequent concrete
approved plan; the initial workflow deliberately cannot enable them. Verify the
first scheduled run at 09:17 UTC, reconcile a completed day's separately queried
sitewide total with exact-path views, and check public totals only against their
public allowlist. Import one bounded batch per request, resume saved progress and
keep backfill gaps separate from daily freshness. See the
[analytics record](analytics-rollout.md) for dates and count semantics.

Disable collection by approving `ANALYTICS_SYNC_ENABLED=false` and redeploying;
archived data remains intact. The account owner is responsible for least-privilege
token expiration/rotation and retained database backups. The owner stale indicator
is not an external missing-run alert; no such notification has been configured.

Dedicated App setup and the harmless approval test: [release App setup](release-app-setup.md).

Neon direct hostname construction: concatenate the endpoint ID above, a dot,
and `c-2.us-east-2.aws.neon.tech`. These are non-secret endpoint identifiers;
credentials and full connection URLs are excluded.

The [2026-10-11 Vercel Git disconnect/bootstrap proposal](vercel-bootstrap-change.md)
records current targets, verified App authentication, remaining account blockers
and the separate approval sequence. Git disconnect and the harmless bootstrap
have completed; actual production release remains separately authorized.

## App publication failure diagnostics

The publisher keeps its existing Git command, hooks, ten-minute timeout, App scope,
SHA/ancestry checks and single-write policy. It does not change Jest worker settings.
After a Git failure it reports numeric exit status, known signals, timing, the last
recognized pre-push marker (`hook-lint`, `hook-typecheck`, `hook-smoke`,
`hook-coverage`, `hook-complete`) or `git-push` when no marker was recognized.
The marker identifies the last observed phase, not necessarily the root cause.

Captured output is converted into fixed evidence labels for explicit Husky failures,
validation errors, authentication failures, remote rejection and network transport.
Multiple labels may coexist; unknown messages stay unclassified. Neither raw stdout
nor stderr is emitted or written to diagnostic files, and the wrapper does not retain
raw output after classification. Arbitrary messages, URLs, environment values,
headers, tokens and private keys never become report fields.

GitHub HTTP failures retain their safe status/category. Fetch failures separately
retain only allowlisted nested DNS/socket/TLS/timeout cause codes, with bounded cycle
handling; unknown codes and raw causes are discarded. This does not add an API retry
or assume that verification transport failure caused the earlier Git failure.
After any ambiguous write, inspect the actual remote SHA before another attempt.
A new diagnostics commit requires approval of its exact SHA before publication.
