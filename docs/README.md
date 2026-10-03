# Documentation index

## Current contracts and procedures

| Topic                                                         | Canonical home                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Agent entry point / human orientation / contribution workflow | [AGENTS](../AGENTS.md), [README](../README.md), [CONTRIBUTING](../CONTRIBUTING.md)  |
| Validation, tests, hooks, CI                                  | [Validation](validation.md), [coverage policy](coverage-guard.md)                   |
| Chronicle and static page authoring                           | [Authoring](authoring.md), [inference](contentlayer-inference.md)                   |
| Images / generated output                                     | [Images](images.md), [generated files](generated-files.md)                          |
| UI / deterministic dates                                      | [UI](ui.md), [hydration](hydration.md), [typography](typography.md)                 |
| Database and audit events                                     | [Database](database.md), [migrations](migrations.md)                                |
| Authorization and navigation                                  | [Contract](authz/AUTHZ-CONTRACT.md), [workflow](authz/WORKFLOW.md), [menu](menu.md) |
| Cache freshness                                               | [Caching](caching.md), [TCDB refresh](tcdb-refresh-strategy.md)                     |
| Tag graph                                                     | [Tag relationships](tag-relationships-view.md)                                      |
| Debug/legacy bypasses                                         | [Escape hatches](escape-hatches.md)                                                 |
| Acknowledgments                                               | [Flowers naming](naming.md)                                                         |

## Historical decisions and proposals

[Static-page v2](archive/static-page-template-v2.md) preserves targets and an
unimplemented roadmap. Archived WU-375 spike material:
[contract](archive/authz-AUTHZ-CONTRACT.md), [policy](archive/authz-POLICY.md),
[capabilities](archive/authz-CAPABILITIES.md), [schema](archive/authz-SCHEMA-DRAFT.md),
[seeds](archive/authz-SEEDS-PLAN.md), [invalidation](archive/authz-INVALIDATION.md),
[audit](archive/authz-AUDIT.md). These documents are historical, not current rules.
[Changelog](changelog.md) preserves the existing release note.
[Context audit](context-audit.md) records this cleanup and static task walkthroughs.

## Reference material

schema-notes.md is an older pg_dump, not the migration ledger or current schema.
The SQL verification files (tcdb_ranking_rt_verification.sql and
homie_ranking_rt_verification.sql) are operator tools, not automatic CI checks.
contracts/tcdb-snapshot.http is a manual request reference.
BookmarkBreadcrumb.mdx, palette-demo.html, youtube-music-ts-api-notes.md, and
share/ are examples, visual references, integration notes, and share copy;
verify implementations before using them as a contract. The page-local
[Scrolls README](../app/mark2/shaolin-scrolls/_components/README.md) describes that UI.
