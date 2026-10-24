# Validation and CI

## Required baseline

`npm run verify:agent` is the canonical pre-review/pre-commit baseline.
`npm run verify` is an alias for the same complete baseline.
[scripts/verify-agent.mjs](../scripts/verify-agent.mjs) runs sequentially:

1. workflows:check: actionlint validates GitHub Actions workflows and expression contexts.
2. prepare:content: build info, incremental image manifest, Contentlayer build.
3. lint: ESLint using eslint.config.mjs.
4. typecheck:prepared: TypeScript without regenerating content.
5. gen:prisma: Prisma client generation.
6. test:ci:prepared: full Jest coverage in band, once.
7. build:next: Next production build, with SKIP_DB=true scoped to that child.

Jest thresholds are 85% lines/statements/functions and 80% branches, defined in
[jest.config.cjs](../jest.config.cjs). A successful baseline covers lint,
typecheck, Jest, coverage, and build; do not rerun them individually afterward.
`npm test` runs Jest, not Vitest or Playwright, and already passes the Jest config.
For focused diagnosis use `npm test -- --runInBand <test-path>`.

`npm run verify:source` reuses stages 1 through 6 for application-wide source
validation without building Next. `npm run build:validated` runs stage 7 with the
existing stage timer; it requires successful source validation in the same
checkout and environment. It does not regenerate content or Prisma. The complete
local command remains `npm run verify:agent` (or `npm run verify`). All three
entry points share [validation stages](../scripts/validation-stages.mjs) and
[run-stages](../scripts/run-stages.mjs); no second timing system is introduced.
The related smoke suite remains available through `npm run test:smoke` and the
pre-push hook. Running it immediately before the full suite adds no test coverage,
so it is no longer part of the complete baseline. No content-only bypass exists.

The shared runner reuses the launching npm CLI through Node without shell parsing,
including npm.cmd invocations on Windows. Stage environment overrides apply only
to that child; they do not mutate the parent or subsequent stages. Source validation
preserves inherited database guards. Every validated build forces SKIP_DB=true even
when the caller omitted it. Exit failures and signals stop subsequent stages, and
spawn failures report only a fixed diagnostic code. Existing console timings and
optional RELEASE_REPORT_PATH stage records cover all three entry points. The
existing Jest suite exercises these contracts; no duplicate tooling suite is added.

## GitHub Actions workflow validation

`npm run workflows:check` runs pinned **actionlint 1.7.12** against every YAML file
in `.github/workflows`; pass file paths after `--` to check selected workflows.
It validates GitHub Actions expression context availability, types and action
contracts, rather than merely parsing YAML. Unsupported contexts fail the command
and the canonical baseline before any application build. CI invokes
`verify:source`, which includes this check; no additional permissions are needed.

The script obtains the official release archive on first use, verifies a committed
SHA-256 digest, and caches it and the matching executable under ignored
`.cache/actionlint`. Cached archive and executable integrity are checked on each
invocation. Nothing is installed globally; npm, WSL, SSH and credential settings
are preserved. Linux/WSL and macOS x64/arm64 are supported; native Windows users
use WSL. First use needs public GitHub release access and `tar`, with no login or
production credential. Download/integrity/tool failures stop validation; they do
not silently skip it. Delete only this tool's cache to recover from corruption.

GitHub-aware checks are always enabled. Optional host-installed ShellCheck and
Pyflakes are excluded from this command to keep results consistent across WSL
and CI; existing ESLint, TypeScript and application tests remain mandatory.
[actionlint documentation](https://github.com/rhysd/actionlint/blob/v1.7.12/docs/checks.md)
and [GitHub context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability)
describe the validator and supported locations. Regression fixtures invoke the
real pinned validator and recreate the maintenance job-level `runner.temp` failure.
The validator does not execute a workflow or prove live provider configuration.

## Separate checks

| Change                         | Additional verification                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Documentation/context          | `npm run docs:check`; Prettier check of changed files                         |
| Supported formatted files      | `npm run format:check`; see diff-selection limitation below                   |
| Route metadata                 | `npm run lint:metadata`                                                       |
| Static MDX                     | `npm run validate-frontmatter` and `npm run validate-seo`                     |
| Chronicles/inference           | prepare:content in baseline; focused inference/renderer tests                 |
| New image assets               | optimizer from [images](images.md), then `npm run images:check` before commit |
| Vitest-covered client behavior | `npm run test:components`                                                     |
| Browser behavior/hydration     | relevant `npm run test:e2e` specs with prerequisites below                    |
| Rendered SEO                   | relevant `npm run test:seo` or `npm run test:seo:scrolls`                     |
| Database                       | migration/static tests plus [non-production verification](migrations.md)      |
| Copy                           | `npm run check:emdash`                                                        |
| Server data fetching           | `npm run guard:self-fetch`                                                    |

These checks are not included in verify:agent. `assets:report` is read-only;
`assets:check` applies optional size budgets. `coverage:check` reports existing
coverage output; it does not generate coverage. There is no changed-only coverage
script; use test:smoke for quick feedback, then full coverage for the gate.

[check-formatting.mjs](../scripts/check-formatting.mjs) checks supported tracked
files in base..HEAD when a base is found; it can miss uncommitted and untracked
edits. For a working-tree review explicitly run `npx prettier --check <files>`.
FORMAT_CHECK_BASE overrides the base; it does not change this limitation.

## Browser prerequisites

[playwright.config.ts](../playwright.config.ts) loads .env.test and requires
TEST_DATABASE_URL or DATABASE_URL. `npm run test:e2e` invokes pretest:e2e,
prepares content and seeds the test DB; the configured webServer builds and starts
an E2E production server at 127.0.0.1:4321 unless one is reused. Install browsers
with `npm run test:e2e:install`. Do not run seeding against production.
Agents must not start the dev server; coordinate any needed local browser harness
with the user. Report browser tests as unavailable when prerequisites are absent.

### Chart component layout

`npm run test:charts` uses [playwright.charts.config.ts](../playwright.charts.config.ts)
for database-free Chromium checks of all seven Recharts charts. It bundles the real
client components and site CSS into an isolated page; it does not start an app or
dev server, load environment files, or seed data. Install the Playwright browser
using the existing install command above. PLAYWRIGHT_CHROME_PATH can select an
existing Chromium executable.

These checks reproduce the original percentage-container warning and assert
actual positive SVG dimensions, resizing, narrow-screen scrolling, relative
sparkline heights, hidden-to-visible recovery, labels, tooltips, empty states, and component
remounts during client navigation in the fixture. They do not establish live
Next.js route or database integration; use the app E2E prerequisites above for
those checks.

## Hooks and remote CI

[pre-commit](../.husky/pre-commit) runs lint-staged (secretlint, formatting,
ESLint, MD punctuation fixing). [pre-push](../.husky/pre-push) runs lint,
typecheck, related smoke, and full thresholded coverage. It skips when CI=true;
SKIP_COVERAGE_GUARD=1 bypasses the whole hook, only when needed, and does not
waive required validation. [Coverage guard](coverage-guard.md) tracks gate policy.

[ci.yml](../.github/workflows/ci.yml) runs on pushes to main and PRs targeting
main, using Node 22.20.0 from .nvmrc, matching all release workflows. Its
`guardrails` job retains the exact `Lint, test, build` check name. It runs
verify:source with SKIP_DB=true, uploads `coverage-lcov` (missing lcov fails the
job), runs build:validated in the same checkout, then checks security headers on
the production server. There is no CI_ENABLED gate or path-based bypass. Vitest,
formatting, metadata, Playwright, images, and SEO are not CI baseline steps.

All workflows use ubuntu-24.04 and select the application Node version through
node-version-file: .nvmrc. External Actions use full commit SHA pins with release
version comments, including the shared setup action. Their Node 24 action runtime
is independent of the application's Node 22 runtime. The reviewed upstream versions
are [checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1),
[setup-node 7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0),
[cache 6.1.0](https://github.com/actions/cache/releases/tag/v6.1.0),
[upload-artifact 7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2)
and [download-artifact 8.0.2](https://github.com/actions/download-artifact/releases/tag/v8.0.2).
Artifact names, ZIP layout, extraction paths, checksums, hidden-file settings and
retention policies remain part of the existing protected release contracts.

[Dependabot](../.github/dependabot.yml) proposes grouped Actions updates weekly
and npm updates monthly, with at most three and five open version-update PRs
respectively. Next, React and Prisma minor/patch updates are grouped by platform;
major npm upgrades remain individual proposals. These are review proposals with
the normal CI gates; no automatic merge or release is configured. Review Action
release notes, resolved commit SHAs and artifact compatibility before updating pins.
The [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
defines the schedule and grouping behavior.

Application runtime upgrades require coordinated changes: release preflight requires
exactly Node 22.20.0 and the Vercel target validators require 22.x. Changing .nvmrc
alone does not update those contracts or the provider runtime. Keep mocked database
fixture isolation explicit as described below; never globally reset Jest's database
safety flag to accommodate a runtime or workflow update.

The `coverage` job in CI retains the exact `coverage` status context and requires
successful guardrails. It uses `always()` and explicitly fails on failure,
cancellation or skipping of the prerequisite; it cannot pass through a skipped
test suite. It mirrors the full guardrail result, so a build/header failure also
fails coverage. The former standalone coverage workflow is removed: it executed
the same full Jest suite a second time, installed dependencies and regenerated
content. Reports now belong to the CI run; artifact consumers must select CI
rather than the old coverage workflow. The artifact name and lcov path are stable.

### Caches and remaining repeated work

[Shared setup](../.github/actions/setup/action.yml) installs the pinned Node and
locked dependencies, restores npm's download cache and caches `.cache/eslint`.
ESLint uses the content strategy so fresh-checkout mtimes do not invalidate all
entries. Its immutable cache key includes OS, architecture, Node, lockfile,
package/configuration, local ESLint rules, TypeScript configuration and commit.
The Node identity comes from setup-node's resolved output; .nvmrc is also hashed.
Restore prefixes retain all compatibility inputs and omit only the commit; each
new commit can save updated results. Lint and documentation checks always run.

CI caches only `.next/cache`, with OS, architecture, Node, lockfile, package,
Next/TypeScript/Contentlayer/CSS configuration, CI setup/environment definition
and commit in the key. It uses the shared setup's resolved Node output and hashes
.nvmrc, avoiding a second handwritten version pin. Restore prefixes omit only the
commit. Next still builds every time and owns source dependency invalidation, following its
[CI cache guidance](https://nextjs.org/docs/app/guides/ci-build-caching).
Next 16.1.6 disables Turbopack build persistence by default, so CI explicitly sets
NEXT_BUILD_CACHE=1 to enable experimental.turbopackFileSystemCacheForBuild in
next.config.mjs. Other builds retain the default unless they opt in. This is an
[experimental build cache](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache)
in the installed version; changing/removing that flag invalidates the CI cache
configuration key. A cache hit never substitutes for a build or validation result.
Generated Contentlayer documents, build info, completed builds, coverage results,
node_modules and credentials are not cached. Preparation still runs once per
source-validation invocation and reuses the existing image-dimensions cache.

Separate events and SHAs still require their own exact trusted CI evidence.
Ordinary code-only releases reuse successful required checks from the trusted CI
workflow for the exact reviewed main SHA. They do not repeat equivalent full
validation or transfer the CI build. Vercel builds one clean source revision
remotely after the protected human gate; see
[production releases](production-releases.md#native-source-production-path).
Analytics and credential-maintenance workflows retain separate full validation
and Vercel builds. npm ci's postinstall and validation both generate Prisma. The pre-push
hook still runs smoke followed by coverage and prepares via typecheck and coverage;
its release-publication stage markers remain intact. Next's Contentlayer plugin
may also perform its own generation during production builds. These remaining
costs are not silently bypassed by this change.

### Required checks and safe rollout

Read-only inspection on October 13, 2026 found active ruleset
[main-fundamentals](https://github.com/tullyelly/tullyelly.com/rules/7502483)
requiring `Lint, test, build` from GitHub Actions (integration 15368), with strict
up-to-date checks. The release validator in scripts/release/manifest.ts expects
that exact name; its contract is unchanged. Classic branch-protection inspection
returned 403, so an owner must verify those settings separately. No GitHub
configuration was modified.

Before landing, an owner must inspect all applicable branch protection and
rulesets. Ordinary status requirements for `Lint, test, build` and `coverage`
need no rename: both retain their GitHub Actions contexts. If any rule requires
the **coverage.yml workflow file** rather than a status context, first land the
replacement CI gate while temporarily retaining the old workflow, require CI and
observe both checks passing on the same SHA, then remove the old workflow-specific
requirement and land its deletion. Never remove the existing guardrail requirement
or weaken strict checks to make the transition pass. Update external consumers of
coverage workflow run IDs/artifacts. No in-repository consumer pins that workflow.
The coverage policy recommends requiring the retained `coverage` status as well;
the observed ruleset currently requires only the combined guardrail.

### Story 1.1 timing evidence

Use the existing `<== ... completed in ...` and `All stages completed in ...`
log lines. Do not dispatch workflows for benchmarking. The successful main push
at `adfc1435e251c2edb55383c485d3711fa01230e7` ran both workflows on the same inputs:

| Before evidence                                                                                                       | Recorded duration           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| [CI run 38333384135](https://github.com/tullyelly/tullyelly.com/actions/runs/38333384135), complete validation stages | 197.4 s                     |
| CI preparation / lint / Jest / Next build                                                                             | 10.6 / 26.4 / 99.8 / 43.2 s |
| [Coverage run 38333384087](https://github.com/tullyelly/tullyelly.com/actions/runs/38333384087), preparation / Jest   | 7.1 / 32.289 s              |
| Coverage workflow job, including checkout/install/upload/cleanup                                                      | 225 s                       |

Both logs report 211 passing suites, 1,251 passing tests and six opt-in skipped
tests. The separate coverage job's recorded work is eliminated by construction;
this is not a measured reduction in CI critical-path time, since the old jobs ran
concurrently. The CI Jest invocation was in band and coverage used workers, so
their durations are not interchangeable. No after-change GitHub run exists until
these local changes are published through the ordinary review process. Local
validation durations must be labeled as local, with cache state and runner
differences; they do not establish a hosted speedup.

After the change, `CI=true SKIP_DB=true NEXT_BUILD_CACHE=1
NEXT_TELEMETRY_DISABLED=1 npm run verify:agent` passed locally in **143.0 s**:
preparation 5.7 s, lint 29.3 s, TypeScript 4.8 s, Prisma 2.1 s, Jest 52.2 s and
Next build 48.6 s. The existing log is `.cache/story-1-1-verify.log`; no separate
telemetry collector was added. This WSL run used installed Node 22.18.0, existing
dependencies, local environment files, an existing image cache (2,183 reused,
four inspected) and ESLint's first run after changing its cache strategy. It
created `.next/cache/turbopack`; the workflow's exact Node 22.20.0 and hosted cache
restore/save behavior remain untested until ordinary CI runs. It passed 212 suites
and 1,263 tests, including 12 Story 1.1 regression cases; two suites and six opt-in
tests were skipped. Coverage was 88.63% statements, 81.90% branches, 86.79%
functions and 90.06% lines, above the unchanged thresholds. Workflow validation,
docs, explicit changed-file Prettier and diff checks passed. The initial sandboxed
fixture run hit subprocess EPERM; validation passed after local sandbox escalation.

For CI failures inspect complete logs and the failing SHA, compare current
history, and reproduce before changing code. A local pass does not clear a remote
failure until the pushed SHA has passed. A stopped/stalled build is incomplete,
not a successful build. Record failures without weakening checks to obtain green.

## Fixture environment isolation

CI and release validation retain `SKIP_DB=true`. Unit suites that exercise
mocked pool, policy or listener behavior must explicitly isolate that fixture
environment and restore inherited values after each test. Keep dedicated
regressions proving `SKIP_DB` blocks real construction/query/listener paths.
Do not disable the global safety flag or runtime guards to make fixtures pass.

## Sensitive-operation manifest secret scanning

Ordinary source releases generate non-secret evidence automatically and do not
require a deploy-manifest PR. Separate sensitive-operation manifests retain their
existing validation and scanning. The `custom-pg-url` pre-commit scanner permits
only the canonical standalone
`schemaCompatibility.databaseHost` occurrence in a version-2 code-only manifest
that passes the actual release validator, including evidence freshness and target
binding. Other Neon hostname occurrences remain flagged. The exception does not
skip the rest of the file or the recommended secret rules. Decoded JSON strings
are checked for database URLs, URL credentials and secret query parameters;
validation subprocess failures deny the hostname exception without logging input.
