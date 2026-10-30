# Cipher repository context

## Start here

This is tullyelly.com: Next.js App Router, TypeScript, Tailwind, Chronicle MDX
through Contentlayer, static MDX routes, and Postgres-backed persona tools.
NextAuth uses Google and Prisma only for the `auth` schema; domain SQL uses
`lib/db.ts` and `db/pool.ts`. Production builds must not query the database.

Inspect the checkout and applicable nested AGENTS.md files before editing.
Read only relevant context below; implementation and tests establish current
behavior. Historical proposals and generated dumps are not current contracts.
Update the owning documentation when behavior, commands, or procedures change.
Orientation: [README](README.md). Workflow: [CONTRIBUTING](CONTRIBUTING.md).

## Universal rules

- Use npm. Do not start the dev server; the user handles it locally.
- Preserve unrelated working-tree changes. Keep changes focused.
- Never commit secrets or real `.env*` files. Production migrations and deployments
  require a concrete reviewed release and human approval through the protected
  workflow in [production releases](docs/production-releases.md). Preparation,
  policy edits, branch pushes, and MCP access are not production authorization.
  Only the coordinator may initiate an approved release; never approve its gate
  on the user's behalf. Honor URL safety checks and environment guards; do not
  bypass them. Never automatically restore/reset production or reverse migrations.
- Preserve server authorization and dynamic behavior. Do not put sessions or
  request capabilities in a global cache. Menu visibility is not permission.
- Do not change licensing, branding, palettes, persona names, or public URLs;
  renaming `tullyelly`/`shaolin` identifiers requires an approved ticket.
- Strict TypeScript; new `any` requires a TODO and ticket. Use existing ESLint,
  Prettier, UI primitives, Radix dialog wrappers, and design tokens.
- User-visible MD/MDX and JSX text prohibits em dashes; use semicolons.
  Tests/vendor and annotated quotes (`// punctuation-allowed` or frontmatter
  `punctuation: allowed`) are exceptions.
- Use FlowersInline for section acknowledgments; at most one Flowers call per
  section, with matching items surfaced on `/credits`.

## Analytics database operating boundary; WU-1205 amendment

James executes reviewed migration, repair, grant and migration-ledger SQL manually
through his existing DataGrip connections: existing development first, then
existing production after development validation and fresh production preflight.
Cipher and every delegated agent have read-only access to both databases through
all routes, including scripts, tests, APIs, browser actions and workflows. They
must not trigger migration executors, seeds, cleanup, rollback fixtures,
authentication/session writes, collection or import. Runner status/verify can
initialize the ledger and are not read-only inspection tools.

Do not create/reset/rename/delete/promote/restore Neon branches or change default
branches, endpoints, roles, database URLs or environment files. Do not request a
new DataGrip connection or configure `.env.analytics-test.local`. Use existing
authorized read-only access; if unavailable, give James read-only SQL and report
the limitation. Never retrieve or expose credentials. Preserve disposable-test
guards; do not spoof metadata or redirect the write suite at existing development.
Run safe mocks; label database-writing integration tests unrun. James operates
write-producing development checks; Cipher verifies their results read-only.

Normal scheduled Cron writes after James enables analytics are application
behavior, not permission for agents to initiate collection. Existing application
release machinery and human approvals remain in place. The legacy analytics SQL
executor is not authorized by this policy. No new recovery environment or
mandatory isolated restore proof is required; document actual backup coverage,
unrun recovery checks and accepted limitations before production approval.

## Validation

Run `npm run verify:agent` before review; it prepares once, lints, typechecks,
generates Prisma, runs full thresholded Jest coverage once, and builds Next.
Do not repeat those checks after a successful run. Fix failures caused by changes;
report existing failures and incomplete checks accurately. Do not skip CI checks.
Additional required checks and prerequisites are owned by
[validation](docs/validation.md), including formatting, metadata, content/images,
Vitest, Playwright, and SEO. Static documentation checks: `npm run docs:check`.

## Task to context

| Task                    | Read before editing                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Chronicle or static MDX | [Authoring](docs/authoring.md), [inference](docs/contentlayer-inference.md)                              |
| Images                  | [Images](docs/images.md), [generated files](docs/generated-files.md)                                     |
| UI or dialog            | [UI conventions](docs/ui.md), [hydration](docs/hydration.md)                                             |
| Database or migration   | [Database](docs/database.md), [migrations](docs/migrations.md)                                           |
| Authorization or menu   | [Authz contract](docs/authz/AUTHZ-CONTRACT.md), [workflow](docs/authz/WORKFLOW.md), [menu](docs/menu.md) |
| Caching or freshness    | [Caching](docs/caching.md), [TCDB refresh](docs/tcdb-refresh-strategy.md)                                |
| Tests or CI failure     | [Validation](docs/validation.md), relevant test/config and complete CI logs                              |

[Docs index](docs/README.md) identifies current, historical, and reference material.
Task-specific skills live in `.agents/skills/<name>/SKILL.md`; use them when their
triggers apply, rather than loading every skill for every task.
