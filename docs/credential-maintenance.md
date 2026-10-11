# Protected database credential maintenance and recovery

Scope: **[WU-888] Add protected credential-only database maintenance and recovery**.
This is a separate execution path from the analytics release. It resets one reviewed
Neon role password and rebuilds the application already serving production. It
never invokes migrations 076/077, any migration runner, or the migration ledger.
Publication, configuration and rehearsal do not authorize a production operation.

## Architecture and approval boundary

`Dispatch release as dedicated App` accepts mode `maintenance`, action `rotate`
or `recover`, an executor SHA, manifest path and manifest SHA-256. The existing
repository-only App installation token is downscoped to Actions write. The child
`Protected credential maintenance` verifies the App actor and triggering actor,
public bot registration, installation ID, successful exact-SHA parent dispatch,
protected main and unchanged production environment protections. App registration
and installation permissions are still authoritatively verified by the parent.
No Secrets-write permission is added to the App or `GITHUB_TOKEN`.

Two immutable references have different jobs:

- **Executor SHA:** maintenance code reviewed and merged onto protected main.
- **Application SHA:** exact Git commit of the existing production deployment;
  it must be an ancestor of the executor and match authoritative deployment metadata.

A later reviewed manifest-only main commit binds those references without a
self-referential commit hash. Only `maintenance/<name>.json` may differ between
executor and dispatch main. Any code drift stops execution. Preparation checks
provenance and validates the executor, then checks out and validates the exact
application SHA in a separate directory. Vercel CLI 63.1.2 builds with
`--prod --standalone`, locally supplied non-secret settings, `SKIP_DB=true`,
placeholder build-only authentication values and no production provider credentials.
It must not pull production environment values. Failure to build without credentials
is a stop condition, not permission to grant them to preparation.

The application build archive and manifest are checksum-bound. Archive extraction
rejects traversal, escaping links, duplicate entries and special files; application
output cannot overwrite executor source. Recovery reuses the original run's exact
archive, with its recorded digest. Artifacts contain no replacement credential or
production environment export and expire after seven days. Missing recovery
artifacts require a separately reviewed recovery plan; never silently rebuild
from current main.

Only the final execution step of the `production-release` job receives maintenance
credentials, after `tullyelly` approves GitHub's environment gate. Code independently
verifies the recorded approval. App identity, parent provenance, protected main and
human approval are checked again at each target guard. Maintenance shares the
`production-release-tullyelly` concurrency group with the existing production
executor. No existing release workflow or protection is weakened.

## Reviewed non-secret manifest

No live manifest is supplied by this implementation. Create one through the normal
owner-reviewed PR process only after inventory and an isolated rehearsal succeed.
Use `maintenance/<operation-name>.json`; do not put passwords, connection strings,
tokens, SQL or ledger entries in it. The strict schema is in
[scripts/release/maintenance.ts](../scripts/release/maintenance.ts).

| Field                                                                   | Required binding                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `version`, `operationId`                                                | `1`; unique lowercase operation identifier                                                                   |
| `executorSha`, `applicationSha`                                         | Full 40-character immutable commits with the meanings above                                                  |
| `neon.projectId`, `branchId`, `host`, `database`, `role`                | Reviewed project, branch, **direct** endpoint hostname, database and role                                    |
| `vercel.projectId`, `teamId`, `deploymentId`, `productionHost`          | Existing project/team/deployment; host must be `tullyelly.com`                                               |
| `vercel.settings`                                                       | Strict Next.js build settings: framework, Node version, build/install commands, null root/output directories |
| `vercel.settingsSha256`                                                 | SHA-256 of the schema-normalized settings JSON                                                               |
| `evidence.consumerMapConfirmed`, `isolationRehearsed`, `outageAccepted` | All explicitly true only with documented evidence                                                            |
| `evidence.backupVerifiedAt`, `backupEvidenceUrl`, `expiresAt`           | Verified backup/restore evidence URL; backup and expiry within 24 hours                                      |
| `recovery`                                                              | Recovery only: original manifest digest, original run ID, original build archive digest                      |

Previously verified production metadata is an inventory starting point, **not a
current authorization**: Neon project `rough-bush-94516855`, branch
`br-withered-snow-aea0yck6`, direct endpoint `ep-jolly-flower-ae4bmy06`
with DNS suffix `c-2.us-east-2.aws.neon.tech`, database `tullyelly_db`, role
`tullyelly_admin`; Vercel project `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team
`team_pB5TcLa7apLtPAiVrRbcjBG3`, deployment
`dpl_Ce7A2PmQodC9nsjuNpyD3YbH9hWd`, application
`3fce11932f189d940d72d0a9e3c91a8fd9943faf`. Refresh all metadata before manifest review.

Runtime guards check project/team, disconnected Git, no deployment hooks, build
settings digest, custom-domain alias assignment, original deployment and Git SHA,
verified domain, no queued/building production deployment, exact Neon endpoint and
branch/project, database existence and password-authenticated unprotected role.
Incomplete pagination fails closed. Before reset they also recheck environment and
role revisions; before promotion they recheck targets. A new staged deployment is
not assumed to serve production merely because its target is production.

`DATABASE_URL` must be a single production-only variable using the reviewed direct
host, database and role with TLS enabled. Separate preview/development entries
are preserved. A combined production/preview variable or production branch override
is rejected; separate scopes through a reviewed human change first. The same scope
checks apply to the disabled switch and journal.

## Credential installation and minimum access

Do not paste credentials in chat or run this executor from WSL/DataGrip. Configure
secrets through **GitHub repository Settings > Environments > production-release >
Environment secrets** only after separate configuration approval:

1. `NEON_CREDENTIAL_MAINTENANCE_API_KEY`: dedicated Neon API key limited to the
   reviewed project. It needs project/branch/endpoint/database/role metadata reads,
   role password reset, operation reads and password reveal for interrupted recovery.
   A read-only release key cannot reset/reveal. Do not reuse a personal organization-
   wide key or expand `NEON_RELEASE_API_KEY`. Independently test the dedicated key
   against an isolated project/branch first. If the provider cannot supply the reviewed
   scope, stop for a new design; do not silently grant broader access.
2. `VERCEL_RELEASE_TOKEN`: previously planned release identity with only the reviewed
   project's necessary environment read/write, deployment read/create/promote and
   alias/domain/project reads. Use the narrowest supported project access and a
   bounded expiration. If obtaining these operations requires new broad team/admin
   permissions, stop for review. It is never passed as a command-line token.
3. `VERCEL_AUTOMATION_BYPASS_SECRET`: optional; only if read-only staged smoke requests
   otherwise encounter deployment protection. It is sent solely to allowlisted HTTPS
   deployment/site hosts, never arbitrary redirects.

Keep `RELEASE_APP_PRIVATE_KEY` solely in the existing ungated `release-dispatch`
environment. Preserve the four repository `RELEASE_APP_*` metadata variables and
existing repository-only installation. No additional App account permission or
repository-wide production secret is required.

The executor reads the old runtime URL and current role password only in gated
process memory, obtains the provider-generated replacement, verifies a fresh
read-only connection and confirms the old credential fails authentication. It
installs the replacement into Vercel's production-only encrypted `DATABASE_URL`
using an authenticated request body, then reads it back privately. It keeps
`ANALYTICS_SYNC_ENABLED=false`, including an immutable staged-deployment override.
Passwords/tokens/URLs never enter stdout, CLI arguments, artifacts, workflow outputs,
repository files or the journal. Provider errors report a safe boundary only.
CLI stdout/stderr are captured rather than streamed during credential-bearing steps;
Neon and database credentials are excluded from the CLI environment.

**GitHub synchronization is a separate human action.** After runtime repair, obtain
the replacement connection through the Neon console securely and create/update
`RELEASE_DATABASE_URL` in **production-release**, using the same direct target.
Do not reuse legacy repository-level `DATABASE_URL`/`TEST_DATABASE_URL` values.
The workflow does not claim that GitHub, DataGrip, WSL or external consumers have
been updated. Never put the replacement in an unprotected dispatch job merely to
automate Secrets-write access.

## Durable progress and interruption recovery

`CREDENTIAL_MAINTENANCE_STATE` is a production-only Vercel project variable containing
non-secret JSON: operation binding, original manifest/build digests, original run ID,
workflow SHA, environment ID/revision, role revision, rejection confirmation, staged
deployment ID and phase. It is provider-side durable state, not a database table;
no migration or ledger write is needed. Project environment writers are trusted
maintainers and must be tightly controlled. Do not hand-edit/delete this journal
to force a retry. The schema/bindings and live target checks reject a foreign or
malformed journal, but it is not a separate cryptographically signed trust store.

Phases are `reset-intent`, `reset`, `verified`, `configured`, `stage-intent`,
`staged`, `promote-intent`, `complete`. Intent is read-back verified before reset,
deployment creation and promotion. **No mutation API is automatically retried.**
Neon's reset returns operations; completion is polled with a shared bounded budget
before replacement connection tests. A timeout is not proof that reset failed.
The [Neon reset API](https://api-docs.neon.tech/reference/resetprojectbranchrolepassword)
warns that existing connections are dropped and the old password remains valid
until the last operation finishes. Expect a controlled outage and rehearse it.

After any failure or interruption:

1. Stop further release/maintenance requests. Record only run URLs, safe boundary,
   operation/target IDs and journal metadata. Inspect actual provider state read-only;
   an HTTP/process failure can occur after a successful write.
2. If reset intent exists, reveal the **replacement** privately through the gated
   recovery adapter. A changed role revision plus successful new connection and old
   authentication rejection can reconcile a lost reset response. An unchanged or
   unexpected revision stops; recovery never sends another reset request.
3. If configuration was partially written, compare the live URL privately. Writing
   the exact replacement is idempotent; already-installed values are not rewritten.
   A lost checkpoint after installing the URL can resume from the saved rejection
   proof. Never attempt to reconstruct, store or restore the exposed password.
4. If deployment creation was attempted, look up the operation and manifest metadata
   and verify build/application/executor bindings. A unique matching deployment can
   resume; missing/ambiguous coverage stops without creating another deployment.
5. If promotion was attempted, check the live custom-domain assignment. Already-
   promoted matching output can finish verification. An unresolved promotion intent
   stops without another promotion attempt; investigate provider state before a
   separately reviewed recovery decision.
6. Prepare a reviewed recovery manifest preserving operation, executor, application
   and all target/settings bindings. Reference the original manifest digest, run and
   build digest; refresh only expiry/backup evidence. Dispatch action `recover` as
   the App and obtain a **new** explicit `production-release` approval. No human
   rerun bypasses App actor/provenance checks.
7. Preserve the original archive before seven-day retention expires. If it is missing,
   role drift is unexplained, the original deployment is removed, targets change, or
   a stage/promotion cannot be resolved, stop for a separately reviewed plan. Do not
   delete the journal or use a new operation ID to blindly repeat the mutation.

The original deployment embeds the exposed runtime credential and is not a safe
rollback target after reset. Repair configuration or promote the verified rebuilt
application using the replacement. If provider access fails, use a separately
approved owner-operated repair with the replacement from Neon; never reinstall the
old password. No automatic database restore, old deployment rollback or second
password reset is included.

## Human-operated rehearsal and production procedure

1. Finish the consumer map: Vercel production runtime, any authenticated app/database
   paths, DataGrip connections, WSL ignored environment files, GitHub release secrets,
   external automation and legacy deployment-hook callers. Record only hostname,
   database, role, environment, purpose and owner. Unconfirmed consumers block rotation.
2. Create/confirm a manual isolated Neon test branch and a separate Vercel rehearsal
   project. Do not repoint the production project or production GitHub credentials.
   Verify non-production host/branch/database/role metadata before any connection.
   The production workflow deliberately cannot target an arbitrary rehearsal host;
   use a reviewed isolated provider harness, not relaxed production guards.
3. Rehearse fresh connections, password-reset completion, old-password rejection,
   environment read-back, exact deployed-source credential-free build, staged smoke,
   drift rejection, interruption at each mutation boundary and recovery. Fixture
   tests alone do not prove provider permissions or response compatibility.
4. Verify backup retention and perform a restore to another isolated branch/database.
   Check expected schemas, representative data and authentication there. Record a
   timestamped non-secret evidence URL; taking a backup without proving restore is
   insufficient. Keep database backups independent of password/journal recovery.
5. Refresh production metadata read-only, confirm Git/hook isolation and no queued
   deployments, set collection disabled through a separately approved configuration
   change, confirm distinct production-only variable scope and agree an outage window.
   Refresh the current deployed SHA; never substitute current main. The old deployed
   source must pass its required validation without production credentials. A known
   old-source fixture/build failure is a blocker to investigate, not permission to
   skip validation or change the application SHA.
6. Configure the protected secrets above under separately approved account actions.
   Review the manifest, build settings, consumer/backup/rehearsal evidence, expiration,
   both SHAs and target IDs. Merge only through normal owner review and strict CI.
7. After explicit authorization to perform the concrete production operation, use
   **Actions > Dispatch release as dedicated App > Run workflow**, branch **main**,
   mode **maintenance**, release SHA **executor SHA**, exact manifest path and digest,
   action **rotate**. Do not invoke the child directly. Review the child preparation
   summary's application SHA and build digest, then approve **production-release**
   personally. This documentation is not authorization to run it now.
8. Expect runtime-only completion with phase `complete`, the verified new deployment
   ID, original application SHA and `oldCredentialRejected: true`. Fresh connections
   check database, session role and read-only mode; public GET smoke checks `/`,
   `/shaolin`, `/api/auth/session` with bounded allowlisted redirects. No forms or
   authenticated mutations are submitted. Recheck alias IDs and manually inspect a
   representative database-backed read using a freshly authenticated session; the
   automated public smoke is not a complete authenticated application test.
9. Securely update GitHub `RELEASE_DATABASE_URL`, DataGrip's saved password and each
   inventoried WSL/external consumer, then open **fresh** connections; pooled/cached
   connections are not proof. For old credential rejection, distinguish PostgreSQL
   authentication failure `28P01` from DNS/timeouts/permission errors. Confirm collection
   remains disabled and confirm no schema/ledger change. Provider runtime repair alone
   does not close the consumer-rotation workstream.
10. Record all evidence, remove/replace exposed legacy credentials only through separate
    reviewed changes, verify legacy hooks are revoked at the provider, and schedule
    credential expiration/rotation. The account owner owns key/token rotation and
    database backup/restore responsibilities. Keep the journal as recovery evidence;
    another future rotation requires its own reviewed archival/supersession plan.

## Workflow expression correction

PR #612 exposed a GitHub workflow-validation failure before any maintenance job
started: `runner.temp` was used in job-level `env`, where GitHub does not provide
the runner context. The two steps consuming `APPLICATION_DIRECTORY` now each
bind it at step level to the same runner temporary directory. Temporary artifact
paths, extraction checks, credential-free setup, runner cleanup, App/SHA guards
and the `production-release` approval/credential boundary are unchanged.

The [validation baseline](validation.md#github-actions-workflow-validation) now
runs pinned actionlint before application checks. It validates all workflow
expressions, including runner context availability, and regression fixtures must
reject the exact previous failure. Generic YAML parsing and static string checks
alone did not catch this issue. Passing actionlint establishes local workflow
syntax validity; remote CI and isolated provider rehearsal are still required.

## Verification and remaining blockers

Added workflow, entry point, state machine/provider adapters, safe artifact extractor
and fixture tests are locally reviewable. Tests exercise normal operation, duplicates,
wrong targets/bindings, HTTP/transport failures, shared scopes, partial configuration,
secret-free outputs and before/after failure injection at every state-machine mutation
and checkpoint. Archive fixtures exercise traversal, absolute paths, links, special
files and duplicates. Existing App/protection/approval tests remain required.

No live provider mutation, SQL, reset, secret installation, deployment or workflow
run was performed for this implementation. Non-production provider rehearsal, scoped
credential access tests, current consumer confirmation, exact-old-application build,
backup restore, target/variable-shape confirmation and production configuration remain
**pending**. Runtime guards intentionally fail closed if a provider response lacks the
reviewed fields. Project-bound API credentials do not inherently restrict a Neon key
to one branch or a Vercel token to only one mutation; confirm actual provider scope
before configuring them and stop if broader new permissions would be required.

Publication for human review and live maintenance have separate readiness decisions.
Live maintenance is **NO-GO** until these prerequisites and a concrete approved manifest
are complete. No analytics schema preparation is a prerequisite for this path.

Local verification on this implementation: `CI=true SKIP_DB=true npm run verify:agent`
passed actionlint on all six workflows, lint, types, Prisma generation, full
thresholded Jest coverage (205 suites, 1,138 tests passed; two suites and six tests skipped) and the production build.
Initial sandbox runs blocked local validator/Git subprocess fixtures; the
complete suite passed with authorized local execution permissions. Changed-file
Prettier checks and `npm run docs:check` passed. `npm run check:emdash` reports
existing punctuation in `HomieDirectory.tsx` and `FirstOffTheLineSection.tsx`;
neither file was modified. No browser or live provider integration was run.
