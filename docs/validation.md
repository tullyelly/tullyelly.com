# Validation and CI

## Required baseline

`npm run verify:agent` is the canonical pre-review/pre-commit baseline.
[scripts/verify-agent.mjs](../scripts/verify-agent.mjs) runs sequentially:

1. prepare:content: build info, incremental image manifest, Contentlayer build.
2. lint: ESLint using eslint.config.mjs.
3. typecheck:prepared: TypeScript without regenerating content.
4. gen:prisma: Prisma client generation.
5. test:ci:prepared: related Jest smoke, then full Jest coverage in band.
6. build:next: Next production build.

Jest thresholds are 85% lines/statements/functions and 80% branches, defined in
[jest.config.cjs](../jest.config.cjs). A successful baseline covers lint,
typecheck, Jest, coverage, and build; do not rerun them individually afterward.
`npm test` runs Jest, not Vitest or Playwright, and already passes the Jest config.
For focused diagnosis use `npm test -- --runInBand <test-path>`.

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

## Hooks and remote CI

[pre-commit](../.husky/pre-commit) runs lint-staged (secretlint, formatting,
ESLint, MD punctuation fixing). [pre-push](../.husky/pre-push) runs lint,
typecheck, related smoke, and full thresholded coverage. It skips when CI=true;
SKIP_COVERAGE_GUARD=1 bypasses the whole hook, only when needed, and does not
waive required validation. [Coverage guard](coverage-guard.md) tracks gate policy.

[ci.yml](../.github/workflows/ci.yml) runs on pushes to main and PRs targeting
main, using Node 20, verify:agent with SKIP_DB=true, then a production-server
security header smoke. There is no CI_ENABLED gate. Vitest, formatting, metadata,
Playwright, images, and SEO are not CI baseline steps.
[coverage.yml](../.github/workflows/coverage.yml) independently runs test:coverage
on the same events and uploads lcov on success. Branch protection is remote
configuration; workflow files alone do not prove these checks block merging.

For CI failures inspect complete logs and the failing SHA, compare current
history, and reproduce before changing code. A local pass does not clear a remote
failure until the pushed SHA has passed. A stopped/stalled build is incomplete,
not a successful build. Record failures without weakening checks to obtain green.
