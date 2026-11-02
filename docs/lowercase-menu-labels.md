# Lowercase visible menu labels; migration 096

James executes reviewed SQL through his existing DataGrip connections. Cipher has
inspected both databases read-only and has not applied this migration or written
ledger rows. Follow [migration policy](migrations.md), the existing
[owner DataGrip procedure](analytics-neon-setup.md#owner-execution-of-an-approved-file)
and [protected production approval](production-releases.md).

## Scope and baseline

Migration [096_lowercase_visible_menu_labels.sql](../db/migrations/096_lowercase_visible_menu_labels.sql)
sets `label = lower(label)` for `published AND NOT hidden` menu rows whose labels
actually change. This includes capability-gated destinations that are visible to
some users. Existing spelling, words, spaces and punctuation are retained. IDs,
parents, persona values, URLs, targets, ordering, icons, metadata, requirements,
feature keys and publication flags remain unchanged. Only changed labels receive
`updated_at = now()` and `updated_by = CURRENT_USER`. No inserts, deletes,
authorization changes, schema changes or new permanent triggers are introduced.
Hidden/unpublished labels and already-lowercase rows remain entirely unchanged.
A rerun updates zero rows and no audit timestamps unless new mixed-case labels
have since been published. Future authored menu data should use lowercase labels.

Read-only inspection on November 1, 2026 (America/Chicago) independently checked
project `rough-bush-94516855`, database `tullyelly_db`:

| Target      | Existing branch             | Total rows | Expected updates |
| ----------- | --------------------------- | ---------: | ---------------: |
| Development | `br-crimson-fog-ae22ws22`   |         48 |               24 |
| Production  | `br-withered-snow-aea0yck6` |         48 |               24 |

Both ledgers contain applied 094 and 095 with matching repository checksums.
096 was unused in both ledgers and the checkout before this change. Historical
ledger gaps remain separate; no applied file was changed or recreated.

Expected changes include `Chronicle tags` to `chronicle tags`, `Homies` to
`homies`, `The Crates` to `the crates`, `HEELS HAVE EYES` to `heels have eyes`,
`Bricks: LEGO` to `bricks: lego`, `USPS` to `usps`, and all five `Releases` labels
to `releases`. The complete before/after list comes from the preflight, not a
second menu registry. Totals remain **48 rows; 24 updated, zero inserted** at the
observed baseline. Recalculate expected updates from fresh preflight if data has
changed; do not force a count or overwrite custom words.

The files operate on database-backed persona/menu labels. Header trigger, search
and account text is authored in TSX and is outside these SQL files. Existing
fallback source labels are also outside this data-only migration.

## Manual application and ledger

1. Bind review to an immutable checkout, exact hashes below, target identity and
   expected label diff. Privately match each existing DataGrip TLS endpoint with
   its branch and owner-confirmed binding. Do not change connections or env files.
2. Development first: run the entire
   [read-only preflight](../db/operations/096_menu_labels_preflight.sql), saving
   every result. Review all proposed labels, total rows and full menu snapshot.
   Save suppressed-row JSON, preserved-field JSON and expected-visible-label JSON.
   Stop for wrong target, occupied 096 numbering, failed/conflicting ledger state,
   checksum drift, unexpected baseline or unacceptable proposed labels. Runner
   status/verify can initialize the ledger; do not use them as read-only checks.
3. Coordinate the existing session release lock from the owner procedure; no
   competing migration executor or SQL operator. James executes the entire
   [atomic bundle](../db/operations/096_apply_with_ledger.sql), which records only
   096 immediately before COMMIT. Review both original and bundle hashes. The
   ledger checksum identifies the original migration, not the bundle. Do not
   nest BEGIN/COMMIT or execute both as separate applies. A SHARE ROW EXCLUSIVE
   menu lock serializes competing writers while allowing ordinary reads;
   five-second lock and 30-second statement timeouts bound execution.
4. On error choose Stop and ROLLBACK; do not Ignore. If COMMIT acknowledgement is
   uncertain, inspect state and ledger read-only before any retry. Release the
   session lock afterward. No automatic restore or reverse migration.
5. Restore read-only and run the entire
   [postflight](../db/operations/096_menu_labels_postflight.sql). Require zero
   remaining mixed-case visible labels, unchanged totals and equality of all
   three saved JSON results. Compare full snapshots: only preflight-listed IDs
   may have changed label/update audits; every other row must be identical.
   Confirm Admin requirements and attribution remain intact. Save execution
   evidence and verify the exact applied 096 ledger row. James may rerun in
   development and compare full snapshots to demonstrate a true no-op.
6. Only after confirmed successful execution of the exact original migration
   without the atomic bundle, use
   [096_record_applied.sql](../db/operations/096_record_applied.sql). It asserts
   installed lowercase state under locks, rejects number/checksum/status conflicts
   and records only this file. Matching valid applied rows remain unchanged.
   Timestamps record reconciliation time; original duration is unknown (NULL).
   Installed lowercase state alone is not proof of exact-file execution.
7. James verifies development desktop/mobile/command/search labels after cache
   refresh. Before production, obtain the existing concrete protected approval,
   review actual backup coverage and accepted recovery limitations, run a fresh
   independent production preflight, then repeat the reviewed manual steps.
   No backup/restore proof or production approval is established by this task.

Menu caches retain their 300-second revalidation interval. SQL does not instantly
refresh every rendered menu; subsequent requests must revalidate and clients may
need reloads. This task does not deploy code or change cache behavior.

096 intentionally supersedes 094's original title-case label expectations. Do
not replay 094 or run its historical exact-label assertions as the final contract
after 096; keep applied files/checksums immutable and use 096 postflight for label
state, alongside 095's protected requirements checks.

## Exact SHA-256 values

- `db/migrations/096_lowercase_visible_menu_labels.sql`: `01dd48d552bcb84193297aab0c283ba60734f099bb5d2d59b72b67167d756ce8`
- `db/operations/096_apply_with_ledger.sql`: `6b339fed6430567ea2b11ce7501e6d89d46a9e9e3863fbc1d7a0ef35158b9f1b`
- `db/operations/096_menu_labels_postflight.sql`: `a5681650d2384e0e8be9a1a1f2ae28fadab9b06fa1389d4f12ee08108ad4c31c`
- `db/operations/096_menu_labels_preflight.sql`: `fc13e6a317de1d8ed6c472e2208ac4cf6e8e7f32991d6ff5e61ed43a15f0b7f8`
- `db/operations/096_record_applied.sql`: `18b4b7df074e401a2e1ff1e5d8dec910ca5dd8d28e7575cc3174cf4794663e04`

## Validation

`SKIP_DB=true npm run verify:agent` passed once, outside the sandbox, in 125.7
seconds: workflow checks, content preparation, lint/docs, TypeScript, Prisma,
thresholded Jest coverage and database-disabled Next production build. Jest
passed 248 suites and 2,006 tests; two suites and six opt-in tests were skipped.
Coverage remained above the existing thresholds. Build-generated changes to
`next-env.d.ts` were removed from the review diff.

Static checks passed for the original migration body in the atomic bundle,
SHA-256 bindings in both ledger files and the handoff, ledger-only write scope,
and explicit read-only preflight/postflight. Prettier, `npm run docs:check` and
`git diff --check` passed. Live SELECT inspection confirmed both baseline counts
and ledger numbering; no migration/ledger writes, connected write-producing
fixtures, rerun/concurrency rehearsal or browser verification ran. James validates
actual application and preservation in development before approved production.
