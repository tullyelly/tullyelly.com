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

## Clan tag creation

[078_create_missing_clan_tags.sql](../db/migrations/078_create_missing_clan_tags.sql)
is a self-contained SQL transaction for review and manual execution by the operator;
it needs no provider tooling. It targets `dojo.clan` (singular) and requires the
existing tag route metadata and identity triggers through migration 074.

Inserting a clan with a nonblank `tag_slug` creates a missing `dojo.tags` row:
`slug` and `name` use `tag_slug`, `display_name` uses the trimmed, lowercase clan
name, `href` is `/cardattack/clans/{tag_slug}`, `href_kind` is `clan`, and
`is_clickable` is true. Existing tag triggers supply audit and identity metadata.
Updates to `name` or `tag_slug` also create the tag if missing, including when a
clan receives its first `tag_slug`. Clans without `tag_slug` are skipped, matching
the homie trigger convention.

The migration backfills missing tags for existing clans through the same helper.
Existing tags are preserved in full; rerunning the SQL does not overwrite labels,
routes or metadata. Renaming a clan does not rename an existing tag, and changing
`tag_slug` does not remove the previous tag. Review and reconcile the migration
ledger separately for manually applied SQL before using the ledger runner.

[078_clan_tags_test.sql](../db/tests/078_clan_tags_test.sql) provides rollback-only
SQL assertions for a non-production database after applying the migration.

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
