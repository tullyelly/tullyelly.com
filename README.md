# tullyelly.com

A Next.js 16 App Router / React 19 site combining Chronicle MDX, persona
navigation, card and review tools, authenticated comments, and Postgres data.
Tailwind v4 tokens live in `app/globals.css`; Radix provides dialog primitives.
Google sign-in uses NextAuth with Prisma restricted to the `auth` schema.

## Getting started

Use Node 20 (CI baseline) and npm:

```bash
npm ci
cp .env.example .env.local
cp .env.test.example .env.test
npm run prepare:content
```

Configure DATABASE_URL, NEXTAUTH_SECRET (or AUTH_SECRET), GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, NEXTAUTH_URL, and NEXT_PUBLIC_SITE_URL using the examples.
Use a separate TEST_DATABASE_URL for test fixtures. Never commit credentials.
See [database safety](docs/database.md) and [escape hatches](docs/escape-hatches.md).

Humans can start `npm run dev`; its predev hook generates only build info.
It does not run prepare:content. For Chronicle edits, `npm run dev:full` runs
Next and the Contentlayer watcher. Agents must leave dev-server startup to the user.
`npm run build` prepares content, generates Prisma, and builds Next;
`npm run start` serves the resulting production build. Deployments use Vercel;
production changes require explicit authorization.

## Where things live

| Directory                | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| app                      | Routes, layouts, handlers, static MDX, page-local components |
| content/chronicles       | Contentlayer documents published under `/shaolin`            |
| components               | Shared UI and MDX primitives                                 |
| lib                      | Domain data, authz, menu, SEO, content, and cache helpers    |
| db                       | pg pool, SQL migrations, schema and verification utilities   |
| prisma                   | NextAuth-only schema                                         |
| public                   | Static media and optimized assets                            |
| scripts                  | Authoring, generation, validation, and migration tooling     |
| **tests**, lib/**tests** | Jest tests                                                   |
| vitest                   | Separate component/client suite                              |
| e2e, tests               | Playwright suites                                            |

Read [AGENTS.md](AGENTS.md) for agent constraints,
[CONTRIBUTING.md](CONTRIBUTING.md) for contribution workflow, and the
[docs index](docs/README.md) for contracts and procedures.
[Validation](docs/validation.md) owns commands, coverage, hooks, and CI details.

## Troubleshooting

- Content edits missing: rerun `npm run prepare:content`; humans can use the watcher.
- Build-time DB errors: reads must use build-safe paths; see [database](docs/database.md).
- Missing SWC optional dependencies: `npm ci --include=optional`; inspect the
  installed Next/platform versions before using package-repair scripts.
- Metadata/image failures: read [authoring](docs/authoring.md) and [images](docs/images.md).
- Playwright prerequisites: see [validation](docs/validation.md).
