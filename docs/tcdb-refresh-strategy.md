# TCDB Refresh Strategy

## Write To Read Flow

As of `063_incremental_tcdb_ranking_refresh.sql`, TCDB snapshot writes keep the
same public read contracts while narrowing the refresh work.

1. Homie snapshot writes insert, update, or delete rows in
   `dojo.homie_tcdb_snapshot`.
2. Clan snapshot writes insert, update, or delete rows in
   `dojo.clan_tcdb_snapshot`.
3. Row-level `AFTER` triggers run in the same database transaction as the
   snapshot write.
4. Homie row writes call `dojo.refresh_homie_tcdb_ranking_rt(homie_id)`. That
   helper rebuilds `dojo.homie_tcdb_snapshot_rt` for the affected `homie_id`,
   then replaces that homie's latest row in `dojo.homie_tcdb_ranking_rt`.
5. Clan row writes call
   `dojo.refresh_clan_tcdb_ranking_rt(clan_id, sport)`. That helper rebuilds
   `dojo.clan_tcdb_snapshot_rt` for the affected `clan_id` and `sport`, then
   replaces that clan/sport row in `dojo.clan_tcdb_ranking_rt`.
6. `TRUNCATE` on either raw snapshot table still falls back to the existing
   no-argument full refresh functions because PostgreSQL does not expose row
   keys for truncated rows.
7. Ranking pages read the derived latest-row tables:
   `dojo.v_homie_tcdb_ranking_route`, `dojo.homie_tcdb_ranking_rt`, and
   `dojo.clan_tcdb_ranking_rt`.
8. Detail pages read historical derived rows from
   `dojo.homie_tcdb_snapshot_rt` and `dojo.clan_tcdb_snapshot_rt`.

Before migration 063, every snapshot write called the no-argument ranking
refresh function. That function truncated and rebuilt the full historical
derived table, then truncated and rebuilt the full latest-row table.

## Transaction Behavior

The refresh still happens inside the write transaction. These are `AFTER`
triggers, so the derived rows are updated before the snapshot write can commit.
The important change is scope: normal row writes refresh only affected homie or
clan/sport keys instead of every ranking row.

## Growth Risks

- Bulk backfills can still be expensive. Row-level triggers will run once per
  changed row, so a large import may be better handled by loading data in a
  maintenance window and running the no-argument full refresh once.
- The full refresh functions still use `TRUNCATE`; keep them for repair,
  backfill, and TRUNCATE handling, not routine single-row writes.
- Homie and clan name or slug changes are not snapshot writes. If those source
  metadata fields change, run the appropriate refresh helper afterward.
- Database freshness and Next cache freshness are separate. The homie snapshot
  API revalidates homie ranking cache tags after commit; clan snapshot writes
  currently need the shared revalidation route or another cache invalidation
  path.

## Next Improvement

If bulk TCDB imports become common, add a dirty-key queue or statement-level
transition-table triggers that collect distinct affected keys and refresh each
key once per statement. That would keep incremental semantics while avoiding
one refresh per row during imports.

## Verification

Use `docs/tcdb_ranking_rt_verification.sql` after applying migrations. It checks
trigger definitions, raw-to-derived row counts, and latest-row freshness for
both homies and clans.
