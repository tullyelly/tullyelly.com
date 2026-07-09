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

## Existing Databases

A database that predates this ledger has no migration history recorded, so
`status` will show repo migrations as pending until that database is brought
under ledger control. Check this first on a disposable branch or restored copy.
For production or any long-lived shared database, verify the schema state before
choosing whether to apply pending files or backfill ledger rows manually.

The runner does not wrap SQL files in an extra transaction because several
existing migrations already contain their own `BEGIN` and `COMMIT` blocks.
