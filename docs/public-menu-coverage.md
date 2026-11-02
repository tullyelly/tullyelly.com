# Public menu coverage; migration 094

James owns all execution through his existing DataGrip connections. Cipher has
performed read-only inspection only. This is a reviewable handoff, not production
approval. Follow [migration policy](migrations.md), the
[DataGrip procedure](analytics-neon-setup.md#owner-execution-of-an-approved-file)
and [protected production approval](production-releases.md).

## Reviewed files

- Original: [094_complete_public_menu_coverage.sql](../db/migrations/094_complete_public_menu_coverage.sql)
- Read-only [preflight](../db/operations/094_public_menu_preflight.sql)
  and [postflight](../db/operations/094_public_menu_postflight.sql)
- Atomic [DataGrip execution bundle](../db/operations/094_apply_with_ledger.sql),
  including the migration body and its individually scoped ledger insert.

Original migration SHA-256:
`f667053fcf6bf53f5ab25c2661c63052d1fefc22932de8f6818f0372a2bb7e0b`

Execution bundle SHA-256:
`4d8779d8d836b7b15eea1cabf4e2180f445fc2ef3cc705db45a67095f6ca8c26`

Verify both with `sha256sum` before execution. Ledger checksum identifies the
original migration, not the bundle. Never execute both files as separate applies.
The bundle retains the original transaction and adds ledger coordination before
writes and ledger recording before COMMIT; do not wrap it in another transaction.
Ledger timestamps record execution time for the atomic bundle; duration is unknown (`NULL`). Existing
matching applied entries remain unchanged. Conflicting entries stop execution.

## Independently observed baseline

Read-only inspection on November 1, 2026 (America/Chicago), at checkout
`9df20dbd9c35a8a274bccf051e7ed1324cfb3c2d`, inspected project
`rough-bush-94516855`, database `tullyelly_db` independently on:

| Target      | Existing branch             | Table / published view |
| ----------- | --------------------------- | ---------------------- |
| Development | `br-crimson-fog-ae22ws22`   | 33 / 33                |
| Production  | `br-withered-snow-aea0yck6` | 33 / 33                |

Each has six persona roots and 27 links, all published and none hidden. Internal
links use NULL target. The eight repaired rows and six roots have empty metadata;
none of the eight menu features has a role-feature grant. No menu table audit
triggers were present. The live view filters publication, not access. New order
slots are free; the existing unrelated order-10 tie under Uncle Jimmy is retained.

Both ledgers contain applied 076, 077 and 089 through 093. The 089 through 093
filenames and SHA-256 values match the current repository. Current checkout
already contains 090 through 093; the earlier main-at-089 discrepancy is resolved
for these files. Neither ledger nor checkout contained 094 before this change.
Historical gaps for the other repository migrations remain unresolved and outside
this task. No historical migration was recreated, edited, replayed or baselined.
Do not claim global ledger verification or use runner status/verify to inspect it.

## Reviewed effects

| Persona    | Label                  | Canonical href                | Order |
| ---------- | ---------------------- | ----------------------------- | ----: |
| shaolin    | Chronicle tags         | /shaolin/tags                 |    10 |
| mark2      | Releases               | /mark2/releases               |    90 |
| cardattack | Local Card Shops       | /cardattack/lcs               |    70 |
| cardattack | USPS                   | /cardattack/usps              |    80 |
| cardattack | Releases               | /cardattack/releases          |    90 |
| theabbott  | Releases               | /theabbott/releases           |    90 |
| unclejimmy | Volleyball Tournaments | /unclejimmy/squad/volleyball  |    30 |
| unclejimmy | Bricks: LEGO           | /unclejimmy/bricks            |    40 |
| unclejimmy | Call A Save Point      | /unclejimmy/call-a-save-point |    50 |
| unclejimmy | Golden Age             | /unclejimmy/golden-age        |    60 |
| unclejimmy | Table Schema           | /unclejimmy/table-schema      |    70 |
| unclejimmy | Releases               | /unclejimmy/releases          |    90 |
| tullyelly  | Traffic statistics     | /stats                        |    30 |
| tullyelly  | Flowers                | /credits                      |    40 |
| tullyelly  | Releases               | /tullyelly/releases           |    90 |

All additions are direct root children, kind `link`, NULL target and feature key,
empty metadata, hidden false, published true. IDs and creation audits use database
defaults. Existing matching additions are untouched, including their audit fields,
icons and unrelated metadata. A differing existing label, target or order stops
execution for review; the migration does not overwrite customization.

Exactly these existing destinations lose their menu feature key in place:
`/cardattack/homies`, `/cardattack/clans`, `/cardattack/categories`,
`/theabbott/crates`, `/theabbott/homies`, `/theabbott/clans`, `/unclejimmy/fam`,
`/unclejimmy/squads`. Only feature key and update audit fields change. All IDs,
labels, icons, URLs, ordering, parents, creation audits, publication and metadata
remain intact. Requirements metadata must be absent or an empty array; unexpected
requirements stop execution rather than being cleared. Roots must also be public.
Features, grants, memberships, scopes, disabled flags and mutation enforcement
remain unchanged. `/mark2/admin` is deferred to its companion protected task.

At this baseline expect **15 inserts, eight updates, 48 total rows, six roots,
42 links**, and 48 rows in the published view. The preflight reports remaining
insert/update counts; partial prior installation reduces them. Recalculate totals
from the saved baseline plus missing destinations; never delete rows to force 48.
A second application changes no menu rows and no audit timestamps.

## Manual execution and stop conditions

1. Bind review to an immutable checkout, both hashes, target identity and expected
   effects. Privately match the existing DataGrip TLS endpoint to branch metadata
   and the owner-confirmed binding; database and role alone cannot identify a
   branch. Do not retrieve credentials or change connections/environment files.
2. On existing development, enable DataGrip read-only and run the entire preflight.
   Save every result, including full menu and ledger, unrelated-row JSON and
   preserved-fields JSON for repaired rows. Resolve failed/unknown ledger entries
   or checksum drift separately. Recheck number 094 immediately before execution.
3. Stop on ambiguous/missing parents, duplicate href/prior-feature identities,
   wrong parent/persona/kind, unexpected gate or requirements, hidden/unpublished
   roots or targets, changed addition state, new order collisions or unexpected
   baseline changes. All target assertions run before any menu writes. Stop on
   timeout; do not increase it without review. The five-second lock timeout and
   30-second statement timeout bound the table lock. Its SHARE ROW EXCLUSIVE mode
   blocks all competing menu writers, including those without advisory locks;
   ordinary reads continue.
4. Coordinate the existing release session lock described in the DataGrip
   procedure; proceed only when `pg_try_advisory_lock(hashtextextended(
'cipher:schema-migrations', 0))` returns true. No concurrent runner or SQL
   operator. James permits writes and executes only the complete atomic bundle,
   stopping on the first error. No separate ledger operation or apply-all runner.
   On SQL error, ROLLBACK the session. On uncertain COMMIT, inspect effects and
   ledger read-only before any retry. Release the session advisory lock afterward.
5. Restore read-only and run the entire postflight. Require unrelated-row JSON
   equality and repaired preserved-fields JSON equality with preflight; review
   the full diff to confirm exactly the planned changes. This checks every field
   of unrelated rows, including `blueprint`, `vault`, `cipher`, `circus`, `forge`
   and `/mark2/admin`. Confirm the exact 094 checksum, sha256 algorithm, applied
   status and timestamps. Save owner execution evidence; installed effects alone
   never prove execution of the exact file. James may rerun the bundle in
   development and compare full-menu exports to demonstrate a true no-op.
6. James validates development behavior in his existing app: signed-out and
   signed-in menus, desktop/drawer/command search, each directory destination and
   retained protected authorization. Wait for menu revalidation before judging.
7. Before production, obtain the existing concrete protected approval and run a
   **fresh independent production preflight**. Record actual backup coverage,
   retention, unrun restore checks and accepted recovery limitations. None was
   established by this task. Use the same reviewed hashes and steps only after
   development validation. Preserve target-specific before/after evidence. No
   automatic restore, rollback migration, new recovery branch or deployment.

## Route coverage and intentional exclusions

The ten fixed additions have real `app/.../page.tsx` implementations. The five
release destinations use `app/[alterEgo]/releases/page.tsx` and the allowlist in
`lib/persona-release-feeds.ts`; Shaolin is not a release feed. Existing public
browse pages for all eight repaired destinations remain implemented. No runtime
menu registry, groups, deeper menus or new capabilities are introduced.

Retain `/unclejimmy/squad` as a curated page distinct from `/unclejimmy/squads`,
along with cute-stamps, hug-ball and `/tullyelly/ruins`. Dedicated home, search,
profile and authentication controls are not duplicated. Exclude APIs,
diagnostics, playground/test/error pages, redirect aliases and individual detail
URLs. Do not import stale fallback `/docs`, `/tcdb`, `/system/health`,
`/mark2/about-personas`, `/unclejimmy/cute-cards`, or invented
`/theabbott/crates/homies`, `/theabbott/crates/clans`, `/shaolin/releases`.

## Freshness and validation evidence

`lib/menu/getMenu.ts` caches capability-keyed menu results with a 300-second
revalidation interval. SQL does not invalidate those Next caches. Existing
rendered menus may stay stale until subsequent requests trigger revalidation;
300 seconds is not a guarantee that every rendered menu has refreshed. Reload
and inspect both signed-out and signed-in menus after refresh. This change does
not alter cache or server authorization behavior.

Both targets passed the exact preflight assertion block in repeatable-read,
explicit read-only transactions through MCP. SELECT/catalog inspection confirmed
table structure, view definition, menu state, ledger and grant facts. The MCP
single-statement endpoint cannot execute the complete multi-command SQL file;
assertions ran through its transaction tool with READ ONLY set before them.
DataGrip preflight/postflight exports and post-application assertions remain
James's execution steps.

Static checks passed for the 23 unique destinations, route/feed coverage, identical
SQL manifests, read-only preflight/postflight, unchanged migration body in the
atomic bundle and its embedded checksum. Prettier, `npm run docs:check` and
`git diff --check` passed.

`SKIP_DB=true npm run verify:agent` passed workflows, content preparation, lint,
TypeScript and Prisma generation, then failed before Jest tests at Next's
TypeScript `--showConfig` parsing. Jest coverage and Next build were not reached.
No connected database-writing tests, migration, ledger writes, seeds, rollback
fixtures, collection/import, browser authentication writes, or dev server ran.
No live SQL application, concurrency rehearsal, rerun proof or rendered browser
verification is claimed. Those write-producing development checks remain with
James; safe assertions do not substitute for them.

## Failed-attempt correction

The initial insert reused `root` as both a PL/pgSQL row variable and a table
alias, causing SQLSTATE 42702 before the insert could execute. The corrected
migration and atomic bundle use `parent_node` for the table alias; the hashes
above supersede the initial files. Stop DataGrip execution and ROLLBACK that
session before retrying. Reconcile any uncertain commit read-only first, then
repeat preflight and review the corrected hashes. Do not record the failed
attempt as applied or continue with Ignore/Ignore All.

The corrected INSERT was planned with `EXPLAIN (ANALYZE FALSE)` inside a DO block
containing the original row-variable declarations, in an explicit READ ONLY
transaction on existing development. Planning passed without executing the INSERT.
This checks the reported name-resolution failure; migration execution and rerun
validation remain James's steps.

## Ledger-only handoff; WU-1242

[094_record_applied.sql](../db/operations/094_record_applied.sql) is the separate
James-operated ledger handoff when the corrected original migration was already
successfully executed without the atomic bundle. Do not use it for the failed
42702 attempt. First verify the original migration hash above and retain evidence
of successful exact-file execution and read-only postflight/preservation results.
Installed state alone cannot prove that execution. Development first; production
requires its existing approval and fresh independent checks.

The file locks the existing ledger and menu, asserts all 23 destinations are in
the reviewed public state, rejects occupied numbering or conflicting/failed
ledger entries, and inserts only the exact 094 row. Matching valid applied rows
are unchanged; it is safe when the atomic bundle already recorded 094. It changes
no menu rows and creates no ledger table. Timestamps record reconciliation time;
original duration is unknown (`NULL`). Stop and ROLLBACK on error; inspect an
uncertain commit read-only before retrying. Other historical ledger gaps remain
outside this handoff. Cipher has not executed this file.

Ledger-only file SHA-256:
`56b625ab15e43d46a04a9ef28ae75bc0d83282aabbc6a16d2aa6c94923658312`
