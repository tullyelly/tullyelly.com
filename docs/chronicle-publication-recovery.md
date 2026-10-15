# Appleton East publication recovery; owner procedure

Status: **completed and publicly verified** for recovery commit
`b6f714ca6d83929096798df9543410bfc771a263`, deployment
`dpl_VnkLN4dbyV6DV8Bz6iJMmbm1LGYP`, on October 14, 2026 at 7:07 pm
America/Chicago (`2026-10-15T00:07:28.528050+00:00`). Public post:
[Appleton East](https://tullyelly.com/shaolin/appleton-east).

The owner approved the exact commit and one-time native-source exception. A clean
source deployment used CLI 63.1.2, `deploy --prod --skip-domain`, the recorded
project/team, SHA metadata and `ANALYTICS_SYNC_ENABLED=false` build/runtime inputs.
The same verified candidate was promoted without rebuilding. Public anonymous
browser checks passed authored text/date, all ten images, all three interactive
carousels, listing, health and authorization checks; aliases matched the exact ID.
No Git push, settings change, database migration or analytics activation occurred.
CLI GET verification initially failed because `curl` forwards `--non-interactive`
to native curl. Removing that flag allowed verification of the existing staged
candidate; no second deployment was created. The commands below are corrected.

The rest of this document preserves the **historical preparation snapshot** and
reviewed procedure. Its old baseline IDs and unapproved status describe that time,
not current production or permission for another deployment. The normal release
repair and its new authorization prerequisites are owned by
[production releases](production-releases.md#normal-release-acceptance-after-recovery).
The emergency exception is exhausted and does not authorize that rehearsal.

## Verified evidence and candidate scope

Read-only owner CLI inspection on October 14, 2026 verified:

- Project `prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU`, team
  `team_pB5TcLa7apLtPAiVrRbcjBG3`, name `tullyelly.com`.
- Both `tullyelly.com` and `www.tullyelly.com` point to
  `dpl_jFgpyNPsGE71w82uaebCbGKfqoJe`, READY production, application
  `adfc1435e251c2edb55383c485d3711fa01230e7`. Release metadata says
  `collectionDisabled=true`; encrypted runtime values were not retrieved.
- Next.js, Node `22.x`, null build/install/output/root overrides; Git disconnected.
  Protection is `all_except_custom_domains`. Preserve these settings, existing
  auth and runtime configuration. Do not enable analytics or collection.
- A project-scoped active-state query returned zero INITIALIZING/QUEUED/BUILDING
  deployments, with no next page. The newest 20 attempts contained no failed-run
  application SHA. Refresh these observations immediately before staging.
- Vercel MCP returned 403 for this exact scope. The existing local owner CLI
  succeeded in the same scope, including the existing directory link. No account
  or scope switch was used. CLI access does not prove workflow-token permissions.

[Failed run 38512310587](https://github.com/tullyelly/tullyelly.com/actions/runs/38512310587),
production job `115685176849`, used workflow
`4bb7d0adb7ea2cfdc09036ab99377072567440f3` and application
`1f4ada0a16958e49042f1826028ffa9d57bd1c7e`. Full job logs confirm validation,
build, downloaded-artifact verification and target checks succeeded; staging
exited 1 and reconciliation found no matching deployment. The provider rejection
was suppressed and remains unknown. Do not retry production to diagnose it.

Local base HEAD is `13fae5bb12b689525bcf6f1f5671c9f17bd7a11b`; its tracked tree
equals that failed application tree. GitHub main was independently read as
`4bb7d0adb7ea2cfdc09036ab99377072567440f3`; its extra release manifest is not a new
application or a successful deployment. Local `origin/main` was stale.

The only pre-existing working-tree edit was the intended publication change
in `content/chronicles/appleton-east.mdx`: `draft: true` to `false`. Every other
authored byte, including date `2026-10-13`, is preserved. Ten image files resolve:
`sectionals.webp`, `dogs.webp`, `hug-ball.webp`, two `george` slides, three `jeff`
slides and two `1037386` slides. No other draft is changed.

This local base is **not content-only relative to production**: 47 files,
2,565 insertions and 247 deletions before this incident's edits. Besides the post,
its ten images and manifest entries, it includes CI deduplication, Node/cache
changes, validation scripts, the single-artifact release executor/bundler,
provenance/extraction/summary changes, tests and docs. The only application
configuration change is the opt-in Next build cache. No database, Prisma, auth
implementation or dependency lockfile differs from live. Review the complete
diff, including tooling; do not infer release approval from this description.

The publication preparation adds the source-readiness command/test and authoring
documentation. `.vercelignore` excludes all `.env*` files from native uploads,
including tracked templates, plus local generated content, provenance and test
outputs; the remote build regenerates its own content and provenance. The CLI
retains its default exclusions.
The independent diagnostic files need not ship to publish the Chronicle:
`scripts/release/provider-diagnostic.mjs`, `scripts/release/code-cli.ts`,
`scripts/release/code-diagnostics.ts`, `scripts/release/release-summary.mjs`,
`scripts/production-release.ts`, their three existing release test files, and the
diagnostic paragraphs in the release policy. Keep that patch separate for review.

There is no new committed application SHA yet. An owner must commit the selected
reviewed inputs through the ordinary source-review process and record that exact
SHA. Never use dirty working-tree source or silently include the independent
diagnostics patch or unrelated unreleased work. Any change after review requires
a new candidate, validation and approval. The full existing CI/tooling diff above
must either be explicitly accepted or excluded in a separately reviewed candidate;
do not reset this checkout to exclude it.

## Required recovery exception; historical preparation

[Production policy](production-releases.md) requires the dedicated App dispatcher,
protected `production-release` human gate, reviewed manifest, credential-free
canonical prebuilt artifact and coordinator-only execution. A native owner CLI
source deployment is outside that mechanism. This document does not amend it.

Before staging, the owner must explicitly record a **one-time incident exception**
to those execution/artifact requirements, naming the exact source SHA, complete
diff, project/team, previous deployment, current settings, disabled collection,
schema compatibility evidence, owner operator, staging approval and separate
promotion decision. Native remote builds use existing production build environment
configuration; they do not have the ordinary artifact builder's empty secret
environment. Review that difference explicitly. No auth/protection setting,
database migration, credential rotation, Git reconnection or automatic deployment
setting change is part of the exception. Keep existing protected approvals intact;
never fabricate a gate approval or reuse the failed run's approval for new source.

If the owner declines this exception, STOP. Use a fresh ordinary protected release
of the corrected source instead; do not use the old artifact or remove guards.

## Owner preparation and reads; no staging yet

Commands below are Bash, npm only. Use the existing authorized CLI account and
the same explicit scope. Stop on identity/access mismatch; do not log in as a
different account, auto-link, print tokens, pull production env files or use debug
logging. Provision CLI 63.1.2 separately with `npm install --global vercel@63.1.2`
if needed, before exposing release credentials. The installed version's help and
source were checked: `--project`, `--prod`, `--skip-domain`, `--non-interactive`
are supported; `VERCEL_TOKEN` is read from the environment. An isolated invalid
synthetic environment token was rejected locally without a provider request.
This does not establish the failed workflow token's deployment permissions.
An actual CLI 63.1.2 synthetic `deploy --dry --json` in this same authorized
scope included the source fixture and placed `.env.example` only in `ignored`,
not `files`; it created no deployment.
The actual workspace dry run also included the corrected post, all ten images
and manifest, with zero environment files or excluded generated outputs in `files`.

First select the owner-reviewed 40-character application SHA; the placeholder
intentionally fails until replaced. Clone locally so uncommitted work stays intact:

```bash
set -euo pipefail
umask 077
export RECOVERY_SHA='REPLACE_WITH_REVIEWED_40_HEX_APPLICATION_SHA'
[[ "$RECOVERY_SHA" =~ ^[a-f0-9]{40}$ ]]
export RECOVERY_TEAM='team_pB5TcLa7apLtPAiVrRbcjBG3'
export RECOVERY_PROJECT='prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU'
export RECOVERY_PREVIOUS='dpl_jFgpyNPsGE71w82uaebCbGKfqoJe'
export RECOVERY_EVIDENCE
RECOVERY_EVIDENCE="$(mktemp -d /tmp/appleton-evidence.XXXXXX)"
export RECOVERY_SOURCE
RECOVERY_SOURCE="$(mktemp -d /tmp/appleton-source.XXXXXX)"
git clone --no-hardlinks --no-checkout /home/giannis/shaolin/tullyelly "$RECOVERY_SOURCE"
git -C "$RECOVERY_SOURCE" checkout --detach "$RECOVERY_SHA"
cd "$RECOVERY_SOURCE"
test "$(git rev-parse HEAD)" = "$RECOVERY_SHA"
test -z "$(git status --porcelain --untracked-files=all)"
test "$(vercel --version)" = '63.1.2'
test "$(node --version)" = 'v22.20.0'
git diff --binary adfc1435e251c2edb55383c485d3711fa01230e7 "$RECOVERY_SHA" > "$RECOVERY_EVIDENCE/full-source.patch"
sha256sum "$RECOVERY_EVIDENCE/full-source.patch"
npm ci
npm run chronicle:ready -- appleton-east
CI=true SKIP_DB=true NEXT_TELEMETRY_DISABLED=1 npm run verify:agent
node <<'JS'
// Next regenerates this tracked declaration. Restore only the known generated
// route-import adjustment in this disposable, previously clean source clone.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const original = execFileSync('git', ['show', `${process.env.RECOVERY_SHA}:next-env.d.ts`], { encoding: 'utf8' });
const generated = fs.readFileSync('next-env.d.ts', 'utf8');
if (generated !== original && generated !== original.replace('./.next/dev/types/routes.d.ts', './.next/types/routes.d.ts')) throw Error('Unexpected generated declaration change; stop for review');
fs.writeFileSync('next-env.d.ts', original);
JS
test -z "$(git status --porcelain --untracked-files=all)"
vercel project inspect "$RECOVERY_PROJECT" --scope "$RECOVERY_TEAM" --non-interactive --format json > "$RECOVERY_EVIDENCE/project-summary.json"
```

Review the full patch and local validation, not just the post. No schema consumers
or dependencies changed from the verified live base in this preparation; refresh
owner compatibility attestation against the final selected SHA. Confirm existing
production runtime/auth configuration and disabled `ANALYTICS_SYNC_ENABLED` in the
dashboard without revealing values. Do not alter it. Native staging also sets
the per-deployment build/runtime flag to false as defense in depth.

Immediately before staging, inspect **all** pending/running/waiting GitHub release,
analytics and maintenance workflows in the repository Actions UI. Do not overlap
another operator or approved release. Refresh these Vercel reads; keep response
files private, never paste arbitrary metadata bodies into reports:

```bash
vercel api "/v9/projects/$RECOVERY_PROJECT?teamId=$RECOVERY_TEAM" --method GET --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/project.json"
vercel api "/v4/aliases/tullyelly.com?teamId=$RECOVERY_TEAM" --method GET --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/apex.json"
vercel api "/v4/aliases/www.tullyelly.com?teamId=$RECOVERY_TEAM" --method GET --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/www.json"
vercel api "/v6/deployments?projectId=$RECOVERY_PROJECT&teamId=$RECOVERY_TEAM&state=BUILDING,INITIALIZING,QUEUED&limit=100" --method GET --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/inflight.json"
vercel list tullyelly.com --scope "$RECOVERY_TEAM" --non-interactive --meta "recoverySha=$RECOVERY_SHA" --format json > "$RECOVERY_EVIDENCE/existing-candidate.json"
node <<'JS'
const fs = require('node:fs');
const read = name => JSON.parse(fs.readFileSync(`${process.env.RECOVERY_EVIDENCE}/${name}.json`));
const assert = require('node:assert/strict');
const p = read('project');
assert.equal(p.id, process.env.RECOVERY_PROJECT);
assert.equal(p.accountId, process.env.RECOVERY_TEAM);
assert.equal(p.link == null, true);
assert.equal(p.framework, 'nextjs');
assert.equal(p.nodeVersion, '22.x');
for (const key of ['buildCommand', 'installCommand', 'rootDirectory', 'outputDirectory']) assert.equal(p[key], null);
assert.equal(p.targets.production.id, process.env.RECOVERY_PREVIOUS);
assert.equal(p.ssoProtection.deploymentType, 'all_except_custom_domains');
for (const name of ['apex', 'www']) {
  const alias = read(name);
  assert.equal(alias.projectId, process.env.RECOVERY_PROJECT);
  assert.equal(alias.deploymentId, process.env.RECOVERY_PREVIOUS);
}
const active = read('inflight');
assert.equal(active.deployments.length, 0);
assert.equal(active.pagination.next, null);
console.log('Verified same project, team, settings, protection, aliases and no active attempts.');
JS
vercel deploy --dry --json --project "$RECOVERY_PROJECT" --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/upload-inputs.json"
```

Inspect existing-candidate results and paginate if needed. If any candidate or
ambiguous attempt exists, reconcile its immutable identity and stop before a new
stage; never blindly repeat deployment. Review the dry upload's complete file
list: corrected Chronicle, ten assets, manifest and reviewed source must be
included; `.env*`, `.vercel/output`, credentials and stale build outputs must not
be uploaded. Dry mode creates no deployment. The source clone must stay clean.
Record the exception and exact staging approval only after these checks succeed.

## Owner stage; production target without public domains

Run **once**, only after the exception and staging approval above. This is a new
source build; no `--prebuilt`, `--force`, old artifact, env pull or settings change:

```bash
test "$(git rev-parse HEAD)" = "$RECOVERY_SHA"
test -z "$(git status --porcelain --untracked-files=all)"
vercel deploy --prod --skip-domain --project "$RECOVERY_PROJECT" --scope "$RECOVERY_TEAM" --non-interactive \
  --meta "recoverySha=$RECOVERY_SHA" --meta "releaseSha=$RECOVERY_SHA" \
  --meta "githubCommitSha=$RECOVERY_SHA" --meta 'collectionDisabled=true' \
  --build-env 'ANALYTICS_SYNC_ENABLED=false' --env 'ANALYTICS_SYNC_ENABLED=false' \
  > "$RECOVERY_EVIDENCE/stage.stdout" 2> "$RECOVERY_EVIDENCE/stage.stderr"
```

Do not post raw CLI output; keep it private for owner inspection. On any error,
timeout or missing URL, stop and reconcile using the candidate metadata query
above. Do not rerun the command. Record the immutable ID and verified HTTPS
`*.vercel.app` origin from authoritative metadata, not arbitrary output URLs.

```bash
export RECOVERY_DEPLOYMENT='REPLACE_WITH_VERIFIED_dpl_ID'
[[ "$RECOVERY_DEPLOYMENT" =~ ^dpl_[A-Za-z0-9]+$ ]]
vercel inspect "$RECOVERY_DEPLOYMENT" --scope "$RECOVERY_TEAM" --non-interactive --format json > "$RECOVERY_EVIDENCE/staged-summary.json"
vercel api "/v13/deployments/$RECOVERY_DEPLOYMENT?teamId=$RECOVERY_TEAM" --method GET --scope "$RECOVERY_TEAM" --non-interactive > "$RECOVERY_EVIDENCE/staged.json"
```

Verify ID, ownerId/team, projectId, target=production, readyState=READY,
meta.recoverySha/releaseSha/githubCommitSha equal the reviewed SHA, and
collectionDisabled=true. Confirm the deployment's flag is false without logging
environment values. Both public aliases must still reference RECOVERY_PREVIOUS;
no public domains may have been assigned to the staged ID. No error/partial
deployment qualifies. Native metadata is an assertion; clean reviewed input and
rendered-content checks below are required as well.

Use the existing authorized protected-deployment browser session or `vercel curl`
with an already provisioned bypass credential. Do not disable protection, create
a bypass secret or accept a login page as content. Inspection of pinned CLI 63.1.2
showed that curl can create a missing bypass token through a settings PATCH.
The guard below requires the owner's **existing** approved environment secret
before calling curl, so that creation path is never used. If it is unavailable,
stop and use the owner's existing authorized browser access. Do not print the
secret or put it in command arguments.

```bash
: "${VERCEL_AUTOMATION_BYPASS_SECRET:?Load the existing approved bypass secret locally; do not create one}"
export VERCEL_AUTOMATION_BYPASS_SECRET
vercel curl /api/health --deployment "$RECOVERY_DEPLOYMENT" --scope "$RECOVERY_TEAM" -- --fail --silent --show-error > "$RECOVERY_EVIDENCE/staged-health.json"
vercel curl /shaolin/appleton-east --deployment "$RECOVERY_DEPLOYMENT" --scope "$RECOVERY_TEAM" -- --fail --silent --show-error > "$RECOVERY_EVIDENCE/staged-post.html"
vercel curl /shaolin --deployment "$RECOVERY_DEPLOYMENT" --scope "$RECOVERY_TEAM" -- --fail --silent --show-error > "$RECOVERY_EVIDENCE/staged-list.html"
```

In the staged browser, verify `/`, `/stats`, the post title/date and **actual visible
authored text**, including “Small, but significant improvement to my workflow.”,
“This was a fun deal all around. Glad to be back.” and “Leaner CI”. Verify the
`/shaolin` listing links to `/shaolin/appleton-east`; no login/error/404 shell counts.
Check all three standalone images and every slide of all three carousels;
successful raw-asset requests alone do not prove rendered images work. For each
of the ten paths returned by `npm run chronicle:ready -- appleton-east`, check its
staged GET and the actual browser image request, including `/_next/image` when used.
Use read-only GETs only: unauthenticated `/api/cron/analytics` must return 401;
`/mark2/admin/analytics` must deny or redirect to same-origin login without leaking
private controls. Verify owner/non-owner authorization and a representative
database-backed read without invoking import/sync or submitting writes.

## Separate owner promotion and public verification

Promotion requires a separate explicit owner decision after all staging evidence
passes. Immediately re-read project, both aliases and in-flight attempts using
the earlier commands; the previous ID, settings, protection and Git disconnection
must remain unchanged. Re-inspect the exact staged ID, SHA and readiness. Resolve
any concurrent attempt or drift before acting. Record that promotion approval.

```bash
vercel promote "$RECOVERY_DEPLOYMENT" --scope "$RECOVERY_TEAM" --non-interactive
```

On error or timeout, inspect both aliases and the authoritative deployment before
any next action. Do not repeat promotion, automatically roll back or restore DBs.

Re-read both alias endpoints: each must now name the exact RECOVERY_DEPLOYMENT in
the same project. In an anonymous browser, verify `https://tullyelly.com/` and the
www redirect, `/api/health`, `/stats`, `/shaolin/appleton-east`, `/shaolin`, all ten
rendered images/carousel slides, and the authorization checks above. HTTP 200 or
a green build alone is insufficient. If redirected, require the same path on
`https://www.tullyelly.com` and no third-party or login redirect. Public checks use
no protection bypass credential. Keep analytics disabled and inspect recent
runtime errors without invoking collection. Record time, exact deployment/SHA,
listing link, text and image evidence. **Only then mark publication confirmed.**

Remaining blockers: owner selection/review/commit of the exact source candidate,
successful required validation, refreshed compatibility/settings/attempt checks,
explicit one-time policy exception and staging approval, protected staged-content
verification, separate promotion approval and public verification. Provider
rejection and the workflow token's actual write permissions remain unknown.
