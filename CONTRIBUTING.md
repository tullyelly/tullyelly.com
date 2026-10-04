# Contributing

1. Inspect the current checkout and [AGENTS.md](AGENTS.md), then follow the
   relevant contracts in the [docs index](docs/README.md).
2. Use `cipher/<short-feature-name>` or `feature/<ticket>` branches. Keep
   refactors separate from feature logic and preserve unrelated changes.
3. Update the owning docs alongside changes to behavior or tooling.
4. Run the canonical baseline and applicable additional checks from
   [validation](docs/validation.md). Record incomplete checks and prerequisites.
5. Use `[WU-####] <concise description>` PR titles. Include scope, rationale,
   Jira ID, reviewers, validation, risk notes, and screenshots for UI changes.
6. Do not skip CI checks. Do not infer production deployment or database-write
   authorization from a request to implement code.

Date rendering rules live in [hydration](docs/hydration.md); database procedures
live in [migrations](docs/migrations.md). Keep requirements in their owning docs.
