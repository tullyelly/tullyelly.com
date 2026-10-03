# Repository context audit

Revalidated on 2026-10-03 at checkout 24bc607a097baf172dbe62346b4fcfc4ddecb511,
rather than relying on the earlier main ff1de0b review.

## Inventory and ownership

The original surface had one root AGENTS, no repo skills, root README,
CONTRIBUTING and NOTES, a page-local Scrolls README, docs including authz spike
plans, an old schema dump, examples, share copy and verification SQL, a PR template,
two workflows, a setup action, and two Husky hooks. Relevant config includes npm
scripts/lock/config, Next/Contentlayer/MDX, Prisma, ESLint flat config, Prettier,
Tailwind/PostCSS, Jest, Vitest and Playwright. Root guidance now routes to owners
in the docs index. Nested AGENTS were not warranted because these contracts span
routes, shared components and helpers.

Validation claims were checked against package scripts, verify-agent,
prepare-content, CI and hooks. Static authoring was checked against new-page,
frontmatter/SEO validators and metadata helpers. Authz was checked against
index/resolve, listener, actions, migrations 014/065 and tests. Audit mapping was
checked against log.ts and migration 066. Cache/content contracts were checked
against root-request-data, TCDB consumers, inference, renderer and image generation.

NOTES was removed after extracting DB helper, transaction, audit and cache
material. Hydration documents were merged with parseDateish date guidance and the
fmtRelative caveat. Static-page and authz proposals were archived intact with
status/replacement links. The one-entry changelog remains to preserve history.
ESLint 9 uses eslint.config.mjs; the duplicate legacy config was removed and the
setup action's cache key adjusted. Repository searches found no consumer requiring
the empty .codex file; it was removed. No application, schema, dependency, or CI
validation policy was changed.

## Discovery evidence and static walkthroughs

Skills use .agents/skills/<name>/SKILL.md, supported by
[official OpenAI documentation](https://learn.chatgpt.com/docs/build-skills).
Metadata is discovered first; full instructions load when selected. This session
cannot verify automatic loading in a new host session. These are static
walkthroughs, not independent fresh-session trials:

| Fresh task         | Root route                                                         | Procedure and checks reached                                                                                   |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Add a Chronicle    | Content -> authoring/inference -> content-images skill             | Literal props, slug-local images, generation, relevant tests and baseline                                      |
| Change a dialog    | UI -> ui/hydration                                                 | Radix wrappers, focus/title/close contracts, interaction suites, screenshots and baseline                      |
| Add a migration    | Database -> database/migrations -> database-migrations skill       | Numbered immutable history, safe target, static tests, separate live verification and baseline                 |
| Modify authz       | Authorization -> contract/workflow -> authorization-features skill | Server enforcement, scoped memberships, revisions, invalidation tests and baseline                             |
| Fix a test failure | Testing -> validation                                              | Complete logs/SHA, correct Jest config, separate Vitest/browser suites, baseline and remote status distinction |

`npm run docs:check` checks maintained Markdown file links, documented npm script
names, and repo skill frontmatter. Archives, user content, SQL dumps and external
URL validation are excluded; it cannot prove semantic correctness. Lint runs the
check so baseline CI guards this surface without a separate documentation framework.

## Remaining boundaries

Branch protection requires GitHub verification; workflow source does not establish
merge enforcement. Live DB state and deployed role assignments were not inspected.
The scaffold hero dimensions need author adjustment for the separate SEO ratio
check; scaffold/application behavior stays unchanged. Validation.md owns the
additional checks and prerequisites.

## Validation results

- docs:check: 30 maintained files pass; a temporary negative fixture confirmed
  nonexistent npm scripts and broken local links are rejected.
- All three skills pass the skill-creator quick validator.
- Explicit Prettier check of all changed/new context files passes; diff --check passes.
- verify:agent fails at content preparation on unchanged
  content/chronicles/nate-bargatze.mdx:69, where the closing ReleaseSection crosses
  a Markdown list-item boundary. Production build was not reached.
- Separate lint and typecheck:prepared pass. test:ci:prepared passes smoke and
  full thresholded coverage: 182 suites, 839 tests, 2 snapshots.
  Prepared checks do not establish that content generation succeeded.
- Vitest and browser suites are separate and not applicable to this documentation
  change; no dev server, live DB operation, deployment, or fresh-host trial ran.
