# SQL Migrations

SQL migrations live in `db/migrations` and run through a small ledger-backed
runner. The runner keeps the repo as the source of truth without switching the
app to Prisma migrations.

The focused [analytics migration-file handoff](analytics-migration-handoff.md)
provides exact DataGrip files, checksums, independent target observations and
existing-development-first manual instructions. It records only individually justified 076/077 execution.

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

Production operations require the concrete review and human protected approval in
[production releases](production-releases.md). The owner-operated
[DataGrip procedure](analytics-neon-setup.md) covers individually reviewed files,
exact checksums, atomic ledger handling and read-only postflight. It does not
change application deployment or authorize SQL through code-only approval.
The legacy commands below remain non-production tools; do not use apply-all or
manual SQL to bypass approval or run concurrently with a release executor.
Historical ledger reconciliation requires its own reviewed scope.

## Current analytics database policy

James executes reviewed SQL manually through existing DataGrip connections,
development first and production only after development validation and fresh
production checks. Cipher and delegated agents stay read-only through all routes.
No branch, connection, URL or environment-file changes are permitted. Preserve
write-suite guards and leave database-writing tests unrun; James operates feature
checks. See the full [operating boundary](analytics-neon-setup.md#analytics-database-operating-boundary-wu-1205-amendment).
Application release and human approvals remain unchanged; no analytics SQL
executor is dispatched and no mandatory new recovery environment is introduced.

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

## Player and clan memberships

Player-to-team identity data is covered by
[080_populate_player_clan_memberships.sql](../db/migrations/080_populate_player_clan_memberships.sql).
The [production comparison and evidence](player-clan-membership-backfill.md)
records its reviewed scope, missing homie tag identities, career/college
memberships and records deliberately held for review. The SQL is prepared for
manual execution; production was queried read-only and no migration was applied.

[081_add_lakers_player_memberships.sql](../db/migrations/081_add_lakers_player_memberships.sql)
adds only the reviewed memberships for the new Lakers clan `purple-and-gold`.
The [Lakers comparison and evidence](lakers-membership-backfill.md) records all
20 pairs and the refreshed development/production endpoint checks. Existing
identities and relationships remain unchanged; no player or clan rows are created.

[082_add_celtics_player_memberships.sql](../db/migrations/082_add_celtics_player_memberships.sql)
adds the reviewed Boston playing-career memberships to the new `green-beer` clan.
The [Celtics comparison and evidence](celtics-membership-backfill.md) records all
22 pairs and both branch checks. It changes only relationships and preserves
existing metadata when a pair already exists.

[087_add_marquette_player_memberships.sql](../db/migrations/087_add_marquette_player_memberships.sql)
adds college playing memberships for Dwyane Wade (`flash`), Jimmy Butler
(`playoff-jimmy`) and Wes Matthews (`wes-matthews`) to `golden-eagles`.
Read-only production inspection on 2026-10-25 checked the named homie inventory,
confirmed all required tag endpoints and found none of these three relationships.
Wes Matthews has draft year 2009 in production, identifying Wesley Matthews
rather than his father. Primary Marquette evidence URLs are recorded per seed.
The migration checks identities, resolves IDs at runtime and preserves existing
relationship metadata on reruns. No production writes were performed.
[Read-only postflight assertions](../db/tests/087_marquette_memberships_test.sql)
check the pairs and college evidence metadata after an approved application;
they have not been run against an applied database.

## Homie snapshot differences

[088_enforce_homie_tcdb_snapshot_difference_sign.sql](../db/migrations/088_enforce_homie_tcdb_snapshot_difference_sign.sql)
corrects existing difference signs and adds a check constraint in one transaction.
Ranking 1 requires a nonnegative difference; every other ranking requires a
strictly negative difference. Incorrect signs are flipped without changing their
magnitude; zero for a non-first ranking becomes `-1`. Audit and realtime refresh
triggers remain active. A first-place difference of `-2147483648` cannot be
represented positively as an integer and aborts the transaction for review.
The migration takes an exclusive table lock. Local application validation does
not execute it. Read-only inspection on October 30, 2026 found its exact validated
constraint and zero violating rows in existing development and production, but
no 088 ledger row. This establishes effective schema compatibility, not execution
of the exact migration file. Do not replay 088 or insert an applied ledger row
based solely on this observation. See the
[compatibility review and DataGrip checks](schema-compatibility-review.md).

## Existing Databases

A database that predates this ledger has no migration history recorded, so
`status` will show repo migrations as pending until that database is brought
under ledger control. Use read-only assessment first; for analytics James validates reviewed SQL
manually on existing development under the operating policy above.
For production or any long-lived shared database, verify the schema state before
choosing whether to apply pending files or backfill ledger rows manually.

The runner does not wrap SQL files in an extra transaction because several
existing migrations already contain their own `BEGIN` and `COMMIT` blocks.

For the analytics archive on a manually migrated Neon database, use the
[Neon/DataGrip setup and reconciliation guide](analytics-neon-setup.md). Its
initial catalog inspection uses explicit read-only transactions and does not
initialize the ledger. An unrecorded migration is not proof of missing schema;
review each file before any baseline or replay.

## Category counts

Apply reviewed migration [083](../db/migrations/083_card_category_snapshots.sql),
then [084](../db/migrations/084_card_category_access_and_menu.sql), then
[085](../db/migrations/085_card_category_rankings.sql), then
[086](../db/migrations/086_card_category_difference_and_trends.sql) manually before
using category counts, optional TCDb rankings, signed differences and full trends.
085/086 extend the already delivered schema; 083/084/085 remain unchanged. [Category setup](card-category-counts.md) owns prerequisites,
read-only preflight/postflight SQL, rollback-only manual fixtures and recovery.
These migrations have not been applied by application validation.
