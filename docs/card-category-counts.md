# Category card counts

Use `/cardattack/categories` for independently recorded overall owned-card counts
by category, including sports and non-sport. Open a category for dated history,
its count/ranking charts, and snapshot entry. These public reads match the visibility of clans
and homies. Counts are never summed across categories or inferred from overlapping
homie, clan, set, or trade collections.

`card_count` is the overall owned-card count you record from your collection source
for that category and date. The existing source does not establish whether this
means unique cards or how duplicates are counted; this feature asserts neither.
Keep the source's convention consistent between measurements. Counts range from
0 through PostgreSQL INTEGER's maximum, 2,147,483,647.

## Dates and changes

Dates are real calendar dates, from 0100-01-01 through today in America/Chicago.
Future measurements are rejected by both the API and database. Date-only strings
stay date-only through SQL reads, input and display; they are not shifted through
UTC midnight. The date input defaults to Chicago today.

Latest means greatest measurement date, regardless of insertion time. Change is
current count minus the immediately preceding chronological measurement. Decreases
and unchanged counts are valid. A recorded zero is distinct from “Not tracked
yet.” The first measurement has no previous comparison.

The raw tables are `dojo.card_category` and `dojo.card_category_snapshot`.
`v_card_category_snapshot` joins metadata and uses chronological `lag` comparisons;
`v_card_category_current` includes configured categories without measurements and
selects the greatest measurement date. The category/date unique index supports
history and latest reads in either direction. No stored projection, ranking table,
refresh operation, tag remapping, or fabricated historical measurement is needed.
Backdated inserts and corrections update subsequent comparisons at read time.

Example: record basketball at 12,000 on October 1 and 12,125 on October 20. Latest
is 12,125 with +125 change. Inserting October 10 at 12,050 keeps latest at 12,125
and changes its comparison to +75. Correcting October 10 to 12,060 changes that
comparison to +65. A second create for October 20 returns a conflict and leaves
the existing measurement intact.

## TCDb ranking

Each dated snapshot also accepts an optional positive-integer `ranking`, from 1
through 2,147,483,647. This is your independently recorded overall TCDb rank for
that category on the same measurement date. Lower is better. Count entry does not
require a rank; blank means not recorded, never zero. Historical count-only rows
remain unranked after migration 085; no rankings are inferred.

Rank change follows homies/clans: previous rank minus current rank, so a positive
change means improvement. The immediately preceding chronological snapshot is the
baseline. If either rank is absent, no comparison or flat trend is manufactured;
the chart leaves a gap. Latest still means greatest measurement date, even when
that snapshot has no ranking. An older rank is never presented as the latest
snapshot's rank. Overview sorting by TCDb rank puts recorded ranks first, with
lower values first; measurement dates remain visible.

Rank history uses the same ordinary views as count history. Backdated snapshots
and corrections recompute subsequent comparisons at read time. For example,
October 1 at #1,500 and October 20 at #1,400 is up 100 places. Inserting October 10
at #1,450 makes the latest change up 50; correcting it to #1,440 makes it up 40.

## Difference and complete trends

The optional `difference` is the same signed TCDb difference field used by homie
and clan snapshots. Record the source value as shown rather than converting it to
an unsigned distance. It accepts the full PostgreSQL INTEGER range,
-2,147,483,648 through 2,147,483,647; zero is valid and blank means not recorded.
It shares the snapshot measurement date with the count and ranking.

The overview, detail summary, dated history and Chronicle embeds expose the
recorded difference and derived comparisons. No values are inferred for existing
measurements. The ordinary history/current views derive:

| Field                 | Meaning                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `previous_difference` | Difference on the immediately preceding chronological snapshot.                                                          |
| `diff_delta`          | Current difference minus previous difference.                                                                            |
| `trend_rank`          | Previous rank minus current rank; lower rank is better.                                                                  |
| `trend_overall`       | Rank movement first; when ranks are unchanged, positive difference delta means up, negative means down, zero means flat. |
| `diff_sign_changed`   | Whether difference crossed between negative and nonnegative, including negative to zero and zero to negative.            |

These match the homie/clan comparison rules for recorded values. Categories keep
first/missing comparisons unknown rather than manufacturing flat trends. Rank
movement determines overall trend even if differences are absent; unchanged rank
with an unknown difference baseline leaves overall trend unknown. Missing ranks
also leave overall trend unknown. Difference deltas and sign comparisons remain
available independently when both differences are recorded.

Difference subtraction uses BIGINT in SQL to avoid overflow at the signed INTEGER
bounds; the reader converts that bounded result to an exact JavaScript number.
Backdated insertion, explicit correction and clearing recompute subsequent
comparisons at read time. No refresh function, job or ranking projection is added.

## Entry and correction

With `tcdb.category.snapshot.create`, choose **Add Snapshot** on the overview or
category detail. Select category, measurement date, count, optional TCDb ranking and signed difference, then **Save snapshot**.
The detail action preselects its category. Ranking is optional.
Validation and request failures preserve input. Duplicate dates direct you to
history instead of overwriting a measurement.

With `tcdb.category.snapshot.correct`, choose **Correct snapshot** beside a historical
measurement. The count, optional ranking and difference can change; category and date remain fixed. Corrections
lock the row and record the actor, before/after counts, rankings, differences and date in `dojo.audit_log`
inside the same transaction as the update. Creation and its audit event also commit
together. There is no deletion action. Concurrent corrections serialize on the
row lock; the last committed correction wins and its audit records the value it
actually replaced.

Both server mutations enforce strict revision-aware authorization before acquiring
a transaction client. Existing editor/admin roles receive the new TCDB-scoped
features through migration 084; no memberships are assigned. Existing feature
disables and denies are preserved. UI capabilities are request-specific hints.

## API and client contract

`POST /api/cardattack/categories/snapshots` accepts:

```json
{
  "category": "basketball",
  "measured_on": "2026-10-20",
  "card_count": 12125,
  "ranking": 1400,
  "difference": -20
}
```

`PATCH` on the same endpoint accepts:

```json
{ "snapshot_id": "42", "card_count": 12060, "ranking": 1440, "difference": -50 }
```

`ranking` and `difference` may each be omitted or `null` during creation. For
corrections, an omitted optional field preserves its existing value; explicit
`null` clears that field. The form sends `null` when an optional input is blank. Corrections keep category and
date fixed, and all count/rank/difference changes use the same transaction and cache tag.

IDs are decimal strings, preserving BIGINT precision. Unknown fields are rejected.
Counts must be JSON integers; blank, boolean and string values are rejected.
POST returns 201; PATCH returns 200. Both return
`{ "id": "42", "status": "ok", "freshness": "fresh" }`.
`lib/client/categorySnapshots.ts` supplies the browser client and feedback mapping.

Errors: 400 `INVALID_JSON` or `INVALID_INPUT` (with `fieldErrors`); 401
`UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `CATEGORY_NOT_FOUND` or
`SNAPSHOT_NOT_FOUND`; 409 `SNAPSHOT_ALREADY_EXISTS`; 503 `SERVICE_UNAVAILABLE`
(policy/session unavailable) or `SNAPSHOT_SAVE_FAILED` (persistence unavailable).
Network/commit acknowledgement failures may leave the client uncertain; inspect
history before retrying. Never retry mutations automatically.

Public server readers cache category data for 60 seconds with the shared
`card-category-snapshots` tag. Successful writes expire that tag immediately and
invalidate category, Chronicle and Bricks route layouts. No user capability is
cached in these readers. Post-commit invalidation failure returns success with
`freshness: "pending"`; do not resubmit. Data readers also have a 60-second fallback
TTL. Pages expose unavailable/prerequisite states for failed reads, missing schema,
or database-disabled validation, rather than claiming the collection is empty.
Production builds do not read the database.

## Chronicle usage

```mdx
<ReleaseSection alterEgo="cardattack">
  <CategorySnapshot category="basketball" />
</ReleaseSection>
```

The Chronicle renderer binds `postDate` for full posts and extracted sections.
The component displays that day's count and, when recorded, TCDb rank, signed
difference, their changes, rank/overall trends and difference sign crossing. It uses only that exact calendar date; a missing measurement renders
the linked category label without a count. It never falls back to today's/latest
count. An explicit `snapshotDate` is required when using the component directly
outside the Chronicle renderer. Invalid slugs render nothing. During a database
outage the linked slug remains available.

Category identities are independent of `dojo.tags`; no universal category/tag
mapping has been established. CategorySnapshot therefore does not infer tags or
change existing tag metadata or destinations. Add an intentional frontmatter tag
or PersonTag separately when desired.

## Manual database application

No database writes are part of the implementation validation. Review actual schema
and migration state first; a missing ledger entry does not prove missing schema.
Do not run migration status/verify as read-only diagnostics; both can initialize
the ledger. Do not replay old migrations blindly.

Exact order for manual execution after review:

1. [083_card_category_snapshots.sql](../db/migrations/083_card_category_snapshots.sql).
2. [084_card_category_access_and_menu.sql](../db/migrations/084_card_category_access_and_menu.sql).
3. [085_card_category_rankings.sql](../db/migrations/085_card_category_rankings.sql).
4. [086_card_category_difference_and_trends.sql](../db/migrations/086_card_category_difference_and_trends.sql).

Prerequisites: existing dojo schema, `tullyelly_admin` role,
`dojo.audit_stamp_generic()`; set collector header table (042); authorization apps
`tcdb` and `menu`, roles, role-feature and app-scoped membership tables, revision
functions; `dojo.audit_log` (066); published Cardattack menu parent and `menu_node`.
Each migration is its own transaction. 085 adds the optional rank and appends
chronological rank columns to both existing views; 083/084 remain unchanged.
086 adds optional signed difference and appends difference/overall-trend columns;
083/084/085 remain unchanged. Apply through 086 before using this application. Schema reference definitions are under
`db/schema/tables` and `db/schema/views`. Runtime SQL uses the existing pool and
URL safety guards; Prisma remains limited to auth.

083 seeds only the nine known category labels that are also found in current
set collector headers. Arbitrary theme tags are ignored. It creates no snapshots;
if a label is absent it is not seeded. Review the preflight label output before
application. Additional category identities can be proposed in a later reviewed
migration. No identity-management UI is provided in V1.

084 resolves apps, roles and the Cardattack menu parent by stable keys; it adds
one menu destination through the existing menu architecture, so desktop, drawer,
command search and breadcrumbs share it. Menu grants mirror Clans. Affected
members receive revision bumps/notifications. The existing menu cache may take
up to five minutes to refresh after manually executing SQL; use the existing
menu revalidation procedure if immediate navigation visibility is needed.

Run [read-only verification SQL](card-category-verification.sql) before and after
manual application. It uses explicit read-only transactions and does not touch
the ledger. Confirm the runtime database role can read the views and create/update
snapshots and insert audit events; ownership follows existing `tullyelly_admin`
conventions. If an environment uses another runtime role, deliver any required
privileges as a separately reviewed migration before enabling writes.

After manual application in an appropriate non-production environment, you may
manually run [rollback-only integration fixtures](../db/tests/083_card_category_test.sql).
They mutate fixture rows inside a rollback-only transaction and must not be run
against production. Also manually run [ranking fixtures](../db/tests/085_card_category_ranking_test.sql)
after 085, then [difference/trend fixtures](../db/tests/086_card_category_trends_test.sql)
after 086. They establish SQL chronology/constraints; mocked API tests
do not establish live authorization or audit permissions. Then manually exercise
authenticated creation, conflict, correction, audit failure rollback, public reads,
menu visibility and cache expiration in the app. Do not use `test:e2e` here; its
prehook seeds a connected database.

For recovery, retain the raw measurements and audit history. Stop using mutation
controls or disable the two features through a reviewed migration with revision
bumps, then diagnose and prepare a forward repair. Do not automatically drop
objects, reverse migrations, reset a database, or restore production. Reconcile
any manually applied migration ledger separately using the owning procedure.
