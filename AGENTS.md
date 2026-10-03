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
- Never write to production databases or commit secrets or real `.env*` files.
  Honor URL safety checks and environment guards; do not bypass them.
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

## Validation

Run `npm run verify:agent` before review; it prepares once, lints, typechecks,
generates Prisma, runs Jest smoke and full thresholded coverage, and builds Next.
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
