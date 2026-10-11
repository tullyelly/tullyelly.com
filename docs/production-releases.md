# Human-approved production releases

Cipher prepares and tests releases, then executes migrations and deployments
through the protected GitHub workflow after a human approves the concrete plan.
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

Actual production rollout is not ready. Historical SQL was executed manually;
production ledger reconciliation, current non-production integration, credential
rotation and restore rehearsal remain release prerequisites. Prior catalog
observations must be refreshed before asserting current schema state. The
analytics executor refuses missing ledgers, ambiguous history, checksum drift
and failed entries rather than inserting invented baselines or replaying SQL.

## One-time account setup

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

## Preparing the exact release

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
The password accidentally pasted in chat must be rotated securely before release;
Cipher did not record or use it. A Neon branch named production does not prove Vercel uses
it. Actions verifies authoritative Neon endpoint metadata and SQL database/role
identity again after approval. The collector requires direct connections for
session advisory locking; pooled transaction connections are refused.

## Approval and execution

Cipher presents the exact commit/PR, manifest digest, migrations, targets,
verification, configuration changes, stop points and recovery evidence before
dispatch. The human's routine action is:

**GitHub > Actions > Approved production release > the prepared run > Review
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
