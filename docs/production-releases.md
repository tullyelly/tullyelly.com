# Human-approved production releases

Ordinary code-only releases use one native Vercel source deployment through the
protected GitHub workflow. The operator selects the reviewed merged main SHA;
tooling prepares non-secret evidence, the human approves the existing environment
gate, and the workflow stages, verifies and conditionally promotes that exact
deployment. There is no separate ordinary release-manifest PR or chat attestation.
Database migrations, credential maintenance, analytics activation and other
sensitive operations retain their separate concrete approvals and procedures.

Changed-source evidence and approval reports accept Next.js route brackets,
including `[slug]`, `[...slug]` and `[[...slug]]`, within the existing bounded
filename allowlist. These paths do not bypass compatibility review or the
protected production gate.

Implementation and policy changes do not authorize a live release. Only the
coordinating agent initiates an authorized release. Never approve the environment
gate on the user's behalf, bypass protections, or deploy from an owner-login session.
Pushes and merges do not deploy: Vercel Git integration remains disconnected, with
no replacement automatic preview workflow. Previews need separate authorization
and verified isolated databases.

## Ordinary code-only deployment

### Normal operator procedure

1. Review and merge the application and workflow changes through protected main.
   Select the exact full merged SHA with successful trusted CI. Inspect the diff
   against live production for database consumers, authentication, dependencies
   and configuration compatibility. Surface actual risks before release; code-only
   approval never authorizes migrations or credential/settings changes.
2. Use the existing GitHub App dispatcher in `production` mode with `release_sha`
   set to that SHA; for example:
   `gh workflow run release-dispatch.yml --ref main -f mode=production -f release_sha=<full-reviewed-SHA>`.
   Tooling binds the application/workflow revisions, actual run
   and attempt, exact trusted checks, project/team, live production baseline,
   configuration and compatibility-risk evidence. It does not create a manifest PR.
3. Review the generated evidence and have the authorized human approve the existing
   **production-release** environment gate. Confirm the approved SHA, checks,
   configuration, compatibility risks and current production baseline. No agent
   approves this gate; no second approval is added after staged checks pass.
4. Observe one clean-source `vercel deploy --prod --skip-domain` operation using
   the protected release credential. Wait for authoritative READY identity and
   verify the exact application revision, health, authorization, existing content
   and changed publications/assets on that deployment. Public domains must still
   point at the baseline through staged verification.
5. Recheck the baseline and promote the verified deployment by its exact ID.
   Promotion never creates another build. Verify public aliases, revision,
   health, authorization and publication probes, then record the final sanitized
   report. Failures stop; ambiguous writes are reconciled before considering any
   separately authorized retry. Never automatically roll back.

### Coordination across coding agents

Local and cloud coding agents use isolated checkouts/worktrees and separate working
branches. Existing CI validates their proposed changes. One release coordinator
initiates production through the existing App dispatcher; the protected GitHub
workflow owns production credentials, human approval, the native source deployment,
staged acceptance, exact-deployment promotion and alias verification. No coding
agent, laptop, WSL installation or owner-login session is a required release host.

Keep **main stable for the entire GitHub production run**, from dispatcher selection
through preparation, the human gate, staging, promotion and final checks. Current
guards repeatedly compare live main to the dispatched SHA, including after promotion;
a merge during the run can stop it after production has changed. Agents may keep
working, committing and opening PRs on their own branches; coordinate merges to
main until the run finishes. This documents the current guard, not a new approval
gate or a change to CI.

Before initiating another production release, the coordinator reviews outstanding
**public verification pending** records. Track each exact run, attempt, deployment,
application SHA, failure evidence and latest verification receipt in the existing
release record. Preserve these non-secret records beyond the workflow's short
artifact retention. Do not silently discard pending verification when a newer run
or deployment appears. Record resolution or an explicit supersession decision;
superseded verification is not passed verification. Working branches can advance
while this coordination is pending.

### One-time owner configuration

Reuse the existing project `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team
`team_pB5TcLa7apLtPAiVrRbcjBG3`, GitHub App and protected environments. Keep
`production-release` restricted to main, with `tullyelly` as required reviewer,
self-review prevented and administrator bypass disabled. Verify effective branch
protection and required checks before release; a protected-branch flag alone is
insufficient evidence.

Keep `VERCEL_RELEASE_TOKEN` only in the protected `production-release` environment.
Its narrowest available scope must permit target inspection, source upload,
staged production deployment and promotion for the existing project/team. If the
account cannot restrict a token to one project, document that actual scope. Keep
`VERCEL_AUTOMATION_BYPASS_SECRET` there when deployment protection requires it.
Do not copy the local owner's Vercel login or expand permissions silently.

The pre-gate evidence step needs a separate `VERCEL_RELEASE_READ_TOKEN` in the
main-only `release-dispatch` environment. Vercel's documented
[access-token selector](https://vercel.com/kb/guide/how-do-i-use-a-vercel-api-access-token)
scopes access to a team; it does not promise arbitrary read permissions or a
project-only token. The owner must use a principal with a suitable read-only role,
such as a plan-supported Viewer, and verify that its token can read the required
non-secret project/configuration, alias and deployment metadata while lacking
deployment and settings-write authority. Role/plan restrictions may prevent some
required reads; [Vercel access roles](https://vercel.com/docs/rbac/access-roles)
describe those limits. A token name or GET-only implementation does not establish
read-only authority. Do not substitute an Owner token. Fail closed if the required
reads and capability separation cannot both be established; resolve that owner
configuration before live acceptance. Never retrieve decrypted values.

Installation and validation steps receive neither Vercel credential; only the
reviewed provider read step receives the read token. Credential provisioning and
role changes require their own owner action; this implementation does not perform
them.

Production database, auth and runtime secrets stay on Vercel. This path never
pulls environments, reads decrypted values, applies runtime-secret overrides,
connects to Neon or runs SQL, migrations, seeding or collectors. No
`RELEASE_DATABASE_URL` or `NEON_RELEASE_API_KEY` is needed for ordinary releases.
Keep the reviewed analytics state disabled; do not use this change to activate it.

### Native source production path

The release workflow reuses successful `Lint, test, build` evidence only for the
exact SHA from the trusted CI workflow. Existing CI remains application-wide and
continues its useful validation build. That build is CI evidence, not the canonical
production deployment. The release does not repeat equivalent full validation,
create a local production artifact, run `vercel build`, or transfer an application
build archive between jobs. Node 22.20.0 selected from .nvmrc, locked npm
dependencies and Vercel CLI 63.1.2 remain pinned.

Source comes from the immutable approved Git revision, independently checked
against its commit. The provider receives a clean isolated source tree rather than
the validation checkout's generated working directory. Upload exclusions remove
local secrets, caches, node_modules, recovery artifacts and stale build output
while retaining required application source and media. Source digests, run binding
and provider metadata supplement identity checks; metadata alone never proves
which revision the application is actually serving.

Vercel creates the canonical build in its production build environment. Unlike the
retired credential-free local artifact builder, that environment contains production
runtime configuration. The build command must isolate database access for the build
process and never run migrations or query/mutate production databases. Build-only
flags must not be written into function runtime configuration. Application runtime
authorization, dynamic data and session behavior remain unchanged. New deployments
must report the approved SHA from the existing `/api/__version` endpoint; `unknown`
or provider metadata echoed as application evidence is refused.

After the existing human gate, reviewed provider operations receive the release
credential. CLI installation and source preparation receive none. Staging uses the
production target without assigning public domains, then authoritative API reads
check deployment ID, project/team, source/run/revision binding, READY state and
configuration. QUEUED, BUILDING, failed, cancelled and invalid states cannot promote.
The workflow serializes production operations with the existing non-cancelling
concurrency group and rechecks both production aliases against the baseline before
promotion. Ambiguous operations reconcile the candidate within the bound run and
attempt instead of blindly staging again. Evidence from a different attempt is
refused; a production-job-only rerun cannot reuse the old preparation evidence.
A separately authorized new attempt needs fresh evidence and its human gate;
no retry or full-workflow rerun is automatic.

### Verification and diagnostics

After the existing human gate, the protected credential preflight reports only
whether the release token is present/malformed and whether REST and the actual
pinned CLI each verify the exact project/team. It never prints token values,
prefixes, hashes or character samples. REST metadata access and CLI authentication
are distinct checks; neither establishes permission to create or promote a
production deployment. Missing, malformed or mismatched credentials stop staging.

The CLI receives the protected token through the reviewed environment path, with
an empty temporary HOME and isolated configuration directories for each operation.
An explicit empty global-config directory prevents ambient owner credentials or
cached team state from participating. No owner login, authentication file, env
pull or token argument is substituted. Temporary directories are removed after
the operation, including failures.

If the CLI authentication check fails, two failure-only read probes use that same
token against `/v2/user` and the exact configured team. Reports retain only the
fixed operation, success boolean and available HTTP status; they never publish
response bodies or infer a principal type or write permissions from a successful
read. The original CLI failure remains the primary diagnostic. These reads do not
retry authentication, stage a deployment or add another approval gate.

Staged and public probes check `/api/__version`, `/api/health`, owner/non-owner
route denial and the disabled collection cron contract. Representative existing
Chronicle coverage includes Appleton East's original date/text, ten raw image
hashes, six rendered image sources and three carousel references. Publication
readiness also selects changed chronicles and their assets; an ordinary release
is not an Appleton-East-only publication check. Intentional edits to a reviewed
probe require updating its expectations through review.

Archive acceptance checks the newest published Chronicle's exact link and title
inside the rendered archive table, using the complete target commit's publication,
date and ordering rules. That expectation is bound into release evidence and reused
before and after promotion and by standalone verification; rollback derives it
from the retained application's SHA. Appleton East keeps its direct content and
asset checks and may fall beyond the archive's first ten entries. Old-post edits,
backfills and code-only releases still derive the expectation from the full target
archive.
Earlier evidence artifacts without this archive expectation fail validation; do
not edit their provider-bound bytes or substitute current-main content.

Publication text checks decode rendered HTML entities once after excluding comments
and script, style and textarea content. Heading, content and listing comparisons
preserve literal entity-looking source text and visible escaped angle brackets.
Publication failures retain their existing invariant plus a validated relative
Chronicle/listing route or trusted image path, a fixed failed-condition label, an
optional zero-based text-sample index (0 through 3), and HTTP status when available.
These observations are revalidated for report storage and final summaries; they
never include page content, expected samples, image query URLs or arbitrary headers.
Publication failures remain fatal and cannot use the Cloudflare pending exception.

Page health failures preserve the exact allowlisted probe path, HTTP status and
failed condition in the diagnostic report and final summary. The paths are `/`,
`/shaolin`, `/stats` and `/api/health`; conditions distinguish an unexpected HTTP
status, missing HTML doctype and JSON health that does not report `ok: true`.
Full acceptance also rejects explicit `cf-mitigated: challenge` and
`x-vercel-mitigated: challenge` responses, including otherwise acceptable HTTP
statuses. Allowlisted page observations label these `security-challenge`.
Public HTML probe failures also retain initial/effective public origins and at
most two response observations: hop, origin, HTTP status, UTC timestamp and
strictly validated `x-vercel-id`, selected `x-vercel-error` codes,
`x-vercel-mitigated`, `cf-ray` and `cf-mitigated` values. Only those individual
headers are read; cookies, authorization, response bodies, full header collections,
redirect destinations and arbitrary URLs are never retained. The correlation
fields are revalidated before report storage and summary rendering. Header
presence alone does not identify the service that rejected a request. These diagnostics
do not change the checks or retry failed requests. Older reports that contain only
`code.health-page` cannot establish which probe failed from elapsed time alone.

A staged production deployment has production runtime credentials. Automated
verification uses read-only GETs, with no login, forms, collection or owner mutation
flows. Normal user traffic may still write data. Provider-triggered collection
must remain disabled by the reviewed configuration.

Owner-admin denial can be an HTTP redirect or Next.js's exact streamed
`__next-page-redirect` refresh marker inside a 200 document. The reader accepts
only `/login` or `/api/auth/signin` on the checked origin without following it.
Ordinary admin content, private analytics controls, marker examples, malformed
refreshes, userinfo, fragments, other hosts and HTTP downgrades fail closed.

Public checks accept one HTTPS redirect from `tullyelly.com` to
`www.tullyelly.com` with the exact path and query preserved. Both aliases must
belong to the intended project and expected deployment before and after promotion.
Staged reads remain on the exact API-verified deployment origin. Automation bypass
credentials go only to that staged origin, never public domains or redirect targets;
all requests omit ambient credentials. HTTP probes do not prove interactive carousel
behavior or signed-in owner behavior; keep those limitations visible in acceptance.

Provider failures retain fixed operation/process labels, HTTP/network evidence,
bounded safe reason/code identifiers and a bounded redacted provider error message.
Structured envelopes, JSON lines and text errors can follow CLI progress output;
the bounded tail remains available for selecting the actual error. Known credential
values and transport encodings, authorization/cookie fields, connection strings,
URLs, private keys and opaque secret-like values are redacted before message
truncation. Reports re-sanitize provider fields, and summaries escape Markdown/HTML
in messages. Raw streams, envelopes, hints, suggested commands and arbitrary
exception objects are never published. A safe provider diagnostic survives failed/not-found
reconciliation, and the report retains any verified candidate identity. Reconcile
ambiguous writes using authoritative deployment identity before a retry; do not
repeat staging or build another candidate during promotion.

Fixed phase events distinguish the opaque CLI invocation/upload operation,
authoritative deployment creation, remote readiness, staged verification,
exact-deployment promotion and public verification. Deployment creation is only
completed when an authoritative candidate exists; remote build success requires
READY. Unobserved phases say `not reached`, and a started phase without a terminal
event says `incomplete`. Phase timings use the existing stage clock and may overlap;
the CLI invocation does not expose a precise file-upload/request boundary.

If promotion succeeded and public verification failed, the summary prominently
states **Production promoted; public verification pending.** The same deferred
state applies when promotion succeeded but public checks were interrupted or never
completed. Successful promotion is not successful public verification, and this
state does not authorize a retry or rollback.

For native-source deploys only, successful required staged checks and confirmed
exact promotion may produce a green deployment with **public verification pending**
when the public failure is a structured HTTP 403 Cloudflare challenge. Acceptance
requires the actual `cf-mitigated: challenge` marker, a validated trace from an
allowed public production origin and Ray ID, and fresh production-target, both-alias
and exact deployment/revision identity guards. Error text or the generic
`security-challenge` condition alone is insufficient. The final release report
records `deployment_succeeded=true`, `public_verified=false`, the sanitized reason,
and the existing run, attempt, evidence, deployment and application identities.
The public-verification phase is `pending`, never `success`, and the command does
not print "Verified native source" for this outcome. Preserve that report and its
original evidence in the coordinator's existing release record; a green deployment
badge does not establish full public acceptance.

Every staged failure and every other public failure remains fatal, including bare
403s, Vercel challenges, revision/auth/publication/asset assertions, redirects,
timeouts, 5xx responses and deployment drift. Rollback and the portable full
verifier remain strict. Historical failed/incomplete workflows keep their original
conclusions; this policy change does not rewrite earlier results or bypass a
Cloudflare challenge.

### Portable completion of public verification

Use a reviewed checkout with npm dependencies installed and the original
`release-evidence.json` from `release-evidence-<run>-<attempt>`. The evidence is
non-secret. Do not reconstruct it from current main or substitute an empty
publication plan if the original artifact is unavailable. Run this one command,
substituting the exact release identities and a truthful execution-location label:

```bash
npm run --silent release:verify-public -- --run RUN_ID --attempt ATTEMPT --deployment DEPLOYMENT_ID --sha FULL_APPLICATION_SHA --evidence release-evidence.json --location EXECUTION_LABEL
```

The command is portable across suitable local and cloud environments. It does not
load `.env` files, owner CLI credentials, App private keys or production deployment
tokens. Supply the existing `VERCEL_RELEASE_READ_TOKEN` through an approved
read-only metadata credential context; use optional `GH_TOKEN` with repository and
Actions read access when GitHub requires authentication. Never substitute
`VERCEL_TOKEN` or export the protected deployment credential. If suitable read
access is unavailable, verification remains pending; this change provisions no
credentials, changes no provider settings and requires no plan upgrade.

Only GET requests are made. Before public probes, the command validates the exact
completed native GitHub production run and attempt, repository and application SHA.
It hashes and validates the original evidence and checks that the expected READY
production deployment's recorded metadata binds that digest, source digest, SHA,
run and attempt. Both public aliases and the project's current production target
must match that deployment before and after the checks. A different or superseded
deployment is not accepted as evidence for the requested release. Current main is
not required to remain at the old SHA after the GitHub run has finished.

The protected workflow and follow-up command call the same `checkApplicationHealth`
implementation: representative HTML and health, exact application revision, owner
and cron authorization, retained publication content/listing, all retained image
hashes/rendered sources, and the evidence-bound changed publication/assets. Public
requests remain anonymous, with the same deadlines and strict redirect policy.
The verifier's checkout and execution location are independent of the live
application revision; their difference alone is not a website failure.

The command emits a bounded JSON receipt to stdout with run, attempt, deployment,
SHA, execution label, OS/architecture, Node version, timestamps and result. Preserve
that receipt in the coordinator's release record. It exits zero only for
`public verification passed`; errors, challenges and failed assertions return
`public verification pending` and a nonzero exit, with sanitized diagnostics.
A later successful receipt completes the tracked public checks; it does not rewrite
the original GitHub run's conclusion or prove all release stages succeeded.

Keep **Bot Fight Mode enabled**. A Cloudflare challenge is incomplete public
verification wherever it occurs. Moving the command to another local or cloud
environment may encounter the same challenge; it is not a guaranteed correction.
There is no new runner, verification service, paid service, provider-setting change
or automatic bypass/retry in this procedure.

### Read-only GitHub runner diagnosis

For a public rejection that cannot be correlated from existing evidence, run
`node --import tsx scripts/diagnose-public-health.ts` locally. It reuses the release
request helper with its 30-second deadline and redirect rules, checking the
homepage through both public origins with anonymous GETs and default Node request
attributes. Each origin is checked once; safe observations are printed as JSON,
and any failed status, redirect or HTML assertion makes the command fail. It does
not establish full revision, authorization or publication acceptance.

After the patch is reviewed and merged, an authorized operator can execute the
same probe on GitHub's `ubuntu-latest` runner:

```bash
gh workflow run public-health-diagnostic.yml --repo tullyelly/tullyelly.com --ref main
```

The manual diagnostic workflow needs only `contents: read`; it has no production
environment, application build, production secrets, provider authentication or
mutation. Inspect its safe hop/status/timestamp/request identifiers and correlate
any rejection with provider request evidence. Local success cannot establish
GitHub runner success. A successful runner probe supports reassessment of a fresh
protected release; it does not prove the historical cause or replace release
assertions. Resolve any reproduced rejection before another production attempt.
This homepage-only diagnostic cannot complete a pending release; use the full
bound command above for that purpose.
Do not rerun an old production job for diagnosis. The release entry point remains
`release-dispatch.yml` on main, `mode=production`, with the full reviewed current-main
SHA, empty ordinary manifest fields and the existing human production gate.

`node scripts/release/check-cli.mjs` executes the real pinned CLI against a **simulated
loopback provider**, with nonempty source upload, upload/deployment rejection,
accepted INITIALIZING/QUEUED/BUILDING/READY and ERROR states, JSON success parsing, promotion
failure and planted-credential redaction. These tests establish the local CLI
contract only. They are not real Vercel acceptance, protected-token permission
proof, live environment attachment or a completed production release.

### Separately approved rollback

Rollback remains a separate sensitive operation in dispatcher mode `rollback`,
with its existing version-2 rollback manifest, explicit approval and fresh
compatibility evidence. Its rollback-only protected workflow cannot stage source
or build an ordinary deployment. Verify the retained
READY production deployment, exact application SHA, current production baseline,
configuration and disabled analytics before authorizing the exact-ID rollback.
It does not build new application bytes, restore a database or reinstall credentials.
Never automatically reverse migrations or roll back after failed health checks.

### Separate inactive paths

Dispatcher mode `analytics` retains `analytics-release.yml`, the version-1
migration manifest, ledger checks, backup evidence and separate credentials.
Mode `maintenance` retains credential maintenance. Neither path is invoked or
authorized by ordinary source deployment. Sensitive operations retain their existing
approval procedures and share the production concurrency boundary.

The analytics migration release remains unready: historical SQL was executed
manually, and production ledger reconciliation, current non-production integration,
credential rotation and restore rehearsal remain prerequisites. Refresh catalog
evidence before asserting current schema state. The analytics executor refuses
missing ledgers, ambiguous history, checksum drift and failed entries; it never
invents a baseline or replays historical SQL as part of an ordinary release.

## Normal release acceptance after recovery

Implementation is complete only after the reviewed change and required checks
pass; **protected live acceptance remains pending** until a separately authorized
merged-SHA release succeeds through the real human gate, source upload, remote
build, staged verification, exact-ID promotion and public checks. Do not deploy,
dispatch a release or approve a gate as an implementation test.

Read-only inspection on October 17, 2026 refreshed production as
`dpl_GhRyVjUaGMM3tHFwKjw9esA7aHGm`, READY and promoted for application SHA
`b30853a7a7cef33a6680efbcae66114b462dbd30`, with apex and www aliases. Its version endpoint still reported `unknown`; the
provider metadata identifies this baseline, and new releases require a source-bound
application version. This is a
recorded snapshot, not a baseline to copy into a future release. Evidence must
refresh live identity and compatibility at execution time.

### Incident and retired path

[Run 38670911264](https://github.com/tullyelly/tullyelly.com/actions/runs/38670911264),
production job `116215236556`, used application
`181e8aa566988bb084026d98bb18704b60c8920d` and workflow
`d60594db5bbfddc63c86e1c0443ab531ca0f882a`. Preparation/build and target checks
passed. `vercel.stage` failed with exit 1 and reconciliation not-found. The available
sanitized log retains those facts; the artifacts endpoint was empty when refreshed.
The historical provider rejection remains unknown. Do not claim the separately
reproduced JSON success-parser mismatch caused that exit-1 rejection.

[Run 39046724042](https://github.com/tullyelly/tullyelly.com/actions/runs/39046724042)
attempt 1 stopped before the human gate because the read-token environment secret
was unavailable. After the owner corrected that setup, attempt 2 reached the human
gate and received `tullyelly` approval, then failed at native staging with exit 1,
reconciliation not-found and no candidate ID. Production remained on the recorded
baseline. The old fixed-label parser retained no provider rejection message; raw
CLI stderr was not saved. Its rejection remains unknown. The protected credential
preflight and bounded redacted-message/phase instrumentation describe what a future
separately authorized attempt will observe; they do not establish that historical
failure's cause or authorize a rerun, deployment or settings/secret change.

Earlier runs `38202358849`, `38318822912` and `38512310587` exposed missing
diagnostics or stage failures. Merged repairs accept an absent/null disconnected
project link, preserve fixed provider/process labels, parse CLI 63.1.2 JSON success,
and reconcile authoritative identity. PR #626 also generalized App-owned review
branches/PRs and preserved publication checks. Reuse those changes; do not repeat
the resolved SSH or hardcoded-branch investigation.

The [Appleton East recovery](chronicle-publication-recovery.md) records an
individually approved source deployment and its then-current identity. Its approval
was limited to that release, and its legacy `unknown` version endpoint is not
acceptable for new releases. It is historical evidence, not current authorization.

The ordinary version-2 deploy-manifest PR, fresh chat compatibility attestation,
local `--prod --standalone` artifact builder and `deploy --prebuilt` handoff are
retired. Legacy artifact code remains only where separate analytics, maintenance
or rollback consumers require it; it is not a parallel ordinary deployer. Obsolete
package entry points must not be used to bypass the single source-release path.

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
