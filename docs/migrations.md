# SQL Migrations

SQL migrations live in `db/migrations` and run through a small ledger-backed
runner. The runner keeps the repo as the source of truth without switching the
app to Prisma migrations.

## Ledger

The runner creates `dojo.schema_migration` automatically before it reads or
applies migrations. The table tracks:

- `filename`
- `checksum` and `checksum_algorithm`
- `status`, either `applied` or `failed`
- `applied_at`
- `attempted_at`
- `execution_ms`
- `error_message`

Applied checksums are immutable from the runner's point of view. If an applied
SQL file changes later, `status` and `verify` report `checksum_mismatch`, and
`apply` refuses to continue.

## Approved production releases

Production apply operations use the [protected release workflow](production-releases.md)
after human approval of exact targets, commit, migrations and recovery evidence.
The legacy commands below remain non-production tools; do not use apply-all or
manual SQL to bypass the release gate or run concurrently with the release
executor. Historical ledger reconciliation is a separate reviewed release.

## Commands

Use npm only:

```bash
npm run db:migrate:status
npm run db:migrate:apply
npm run db:migrate:verify
```

The scripts load `.env.local` by default. To target a different local env file,
set `DOTENV_CONFIG_PATH`:

```bash
DOTENV_CONFIG_PATH=.env.test npm run db:migrate:status
```

The runner reads `DATABASE_URL` first, then `TEST_DATABASE_URL`. It honors
`SKIP_DB=true`, refuses database access during a Next production build, rejects
prod-looking URLs outside `NODE_ENV=production`, and keeps the production
`neondb_owner/neondb` guard.

## Daily Workflow

1. Add a new numbered SQL file under `db/migrations`.
2. Run `npm run db:migrate:status` to see pending work.
3. Run `npm run db:migrate:apply` to apply pending migrations in filename
   order.
4. Run `npm run db:migrate:verify` before shipping. It fails if anything is
   pending, failed, missing from the repo, or checksum-mismatched.

Do not edit a migration after it has been applied to a shared database. Add a
new numbered migration instead.

## Clan slug and tag creation

[079_remove_clan_tag_slug.sql](../db/migrations/079_remove_clan_tag_slug.sql)
supersedes migration 078's dependency on the unused `dojo.clan.tag_slug` column.
Run the complete SQL transaction manually after reviewing it; no provider tooling
is required. Existing applied migration files remain unchanged.

`dojo.clan.slug` is the sole clan identifier. Inserts and updates of `name` or
`slug` create missing `dojo.tags` records: `slug` and `name` use the clan slug,
`display_name` uses the trimmed, lowercase clan name, `href` is
`/cardattack/clans/{slug}`, `href_kind` is `clan`, and `is_clickable` is true.
The migration backfills all missing clan tags using that same helper. Existing
tag labels, routes, metadata and audit fields are preserved. Changing a clan
slug creates its missing tag but does not delete the old tag.

Migration 079 replaces both affected views and the old trigger, then drops
`dojo.clan.tag_slug` and its column constraints. The snapshot view no longer
exposes `clan_tag_slug`; its owner, grants and view options are retained. The
trade-partner content-tag view joins clan tags using `clan.slug`. Unexpected
populated legacy values or unknown dependent database objects stop the entire
transaction; the migration does not use cascading drops.

The matching application changes remove clan reads of the retired column and use
`slug` for ranking metadata, snapshots and trade-partner tag links. They work
before and after migration 079, so the application can be released first.
Homie `tag_slug` fields and aliases representing `dojo.tags.slug` remain valid.
Review and reconcile the ledger separately after manually applying SQL.

[079_clan_slug_test.sql](../db/tests/079_clan_slug_test.sql) supplies rollback-only
SQL assertions for a non-production database after applying the migration. It
replaces the older migration 078 fixture, which required the retired column.

## Existing Databases

A database that predates this ledger has no migration history recorded, so
`status` will show repo migrations as pending until that database is brought
under ledger control. Check this first on a disposable branch or restored copy.
For production or any long-lived shared database, verify the schema state before
choosing whether to apply pending files or backfill ledger rows manually.

The runner does not wrap SQL files in an extra transaction because several
existing migrations already contain their own `BEGIN` and `COMMIT` blocks.

For the analytics archive on a manually migrated Neon database, use the
[Neon/DataGrip setup and reconciliation guide](analytics-neon-setup.md). Its
initial catalog inspection uses explicit read-only transactions and does not
initialize the ledger. An unrecorded migration is not proof of missing schema;
review each file before any baseline or replay.
