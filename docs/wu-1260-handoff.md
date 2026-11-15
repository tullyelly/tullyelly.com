# WU-1260 consolidated handoff; November 15, 2026

Epic: WU-1260. Shared branch: `epic/WU-1260-tag-relationships`.
Timezone/day: America/Chicago, 2026-11-15. Repository preparation only; no SQL
application, merge or production deployment occurred. Jira items remain In
Progress with evidence comments; committing does not establish delivery.

| Issue   | Commit / revision                                                                        | Repository status                                                 | Remaining work                                                                       |
| ------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| WU-1271 | `149040b8`                                                                               | Workflow implemented, validated and used immediately              | Review; remote Jira Development ingestion unverified                                 |
| WU-1270 | `dc7bbdc4`                                                                               | Manual migration workflow implemented, validated and used for 098 | Review; no manual SQL required for the chore itself                                  |
| WU-1261 | `7671723312fd1ac55295f9b00e9099147cf240e3` (SQL package); follow-up handoff/test receipt | SQL/protection/tests prepared and statically validated            | James applies/tests development, then approved production; Cipher verifies read-only |
| WU-1262 | No implementation commit                                                                 | Next planning checkpoint, not started                             | Resolve D1-D6 with James                                                             |

The WU-1261 preparation baseline is `dc7bbdc4`. The reviewed SQL package revision
is `7671723312fd1ac55295f9b00e9099147cf240e3`. The following handoff/test receipt
changes no canonical, assertion or operation SQL bytes. Verify with
`git log -1 --format=%H -- db/migrations/098_protect_homie_tag_identity.sql` and
the hashes below before execution. Do not execute from an unreviewed worktree.
No branch push or PR creation is part of this handoff.

## Implemented and validated

WU-1271 adds `.agents/skills/jira-workflow/SKILL.md`, root rules, a durable daily
epic selection, session-specific verified item context, prepare/commit hooks and
a guarded commit helper. Existing author identity is retained. Safe fixtures
cover branch reuse/ambiguity/staleness, child changes, the supplied-key content
exception, combined keys and index advancement. Both subsequent phases used it
on this same branch. Existing release/database approvals remain intact.

WU-1270 extends the existing migration skill, reconciles runner guidance and adds
`docs/manual-migrations.md`, a reusable handoff template and the offline
`manual-migration.mjs` generator/validator. Eight focused checks covered stale
hashes, wrapper/body/filename drift, conditional reconciliation and release-proof
invalidation. The normal operation includes effects, assertions and the existing
`dojo.schema_migration` record in one transaction. The 999 example in the owning
document is explicitly fictitious; do not run it.

WU-1261 supplies guarded canonical migration 098, its atomic operation/manifest,
read-only pre/postflight, function schema reference, human development tests,
safe static checks and [the behavior contract](homie-tag-synchronization.md).
It repairs only reviewed legacy values for the two athlete rows and the exact
stale family fields; unknown newer customization stops. It preserves family IDs,
URLs/clickability and relationship evidence. New write-path guards cover reverse
changes and reachable memberships as well as direct homie edits. No aliases,
collection reasons, UI changes or later-story defaults are implemented.

The full `SKIP_DB=true npm run verify:agent` baseline passed in Phase 1: workflow
checks, content preparation, lint, typecheck, Prisma generation, 249 Jest suites /
2,016 tests, thresholded coverage (88.63% statements, 81.90% branches, 86.79%
functions, 90.06% lines) and Next build. Two suites/six tests were skipped. The
initial test-runner registration failure was corrected before that pass. Later
changes received focused safe tests (six final suites / 36 tests), ESLint,
format/docs and generated-package checks; the successful full baseline was not redundantly repeated. No database
write suite, human SQL test or post-application postflight has run.

## Independent database observations

See [sanitized read-only evidence](evidence/wu-1261-readonly-observations.json).
Project `rough-bush-94516855`, database `tullyelly_db`:

| Target      | Existing branch             | Homie 219                          | Homie 221             | Ledger 098 |
| ----------- | --------------------------- | ---------------------------------- | --------------------- | ---------- |
| Development | `br-crimson-fog-ae22ws22`   | László Kleinheisler / `the-lazer`  | Cal Eldrid / `eldrid` | Absent     |
| Production  | `br-withered-snow-aea0yck6` | László Kleinheisler / `lazer-face` | Cal Eldrid / `eldrid` | Absent     |

Both had 242 non-null homie slugs, no duplicates and no missing current tag rows.
Family tags 33/274 retained their exact family URLs and two unchanged g-league
edges. `cal` had the stale homie kind/context; `the-lazer` had the stale athlete
label/context. Both targets' deployed sync helpers, row trigger and inference
function were inspected independently. Normalized function-body MD5 fingerprints
are guarded in the migration/preflight (comparison fingerprints, not ledger
checksums). Existing ledger shape/constraints were inspected; no initialization
file is needed. These observations are dated and must be refreshed before writes.

The read-only target, ledger and original-state preflight assertion blocks passed
independently on both targets through the read-only MCP. Its prepared-statement
interface rejected the complete multi-statement file; no SQL ran in that failed
call. Each assertion block was then run separately with read-only access. James
must still run the complete script in DataGrip and confirm the existing connection
label/branch. No SQL writes or runner status/verify commands were executed.

### Other residue audit

Development had 24 orphan homie contexts; production had 25 (including the-lazer).
The evidence file records exact IDs, routes and metadata. Existing reviewed
historical mappings remain current for 54/tractor, 91/the-worm, 125/juwan,
155/dikembe, 209/wes, 324/desmond, 417/pau and 708/moses. Migrations 090/092
explicitly retained legacy tags/relationship evidence; this task does not turn
that history into an alias system or rewrite its retained content semantics.

Other candidates include calvin-johnson, carmelo-anthony, daniel-ricciardo,
dominique-wilkins, edgerrin-james, jalen-rose, john-henson, john-stockton,
johnny-newman, lebron-james, patrick-williams, tamarick-vanover, victor-wembanyama,
vince-carter and `zz` (tag 522, label backfill). A name/route resemblance does not
prove ownership or desired historical feed behavior. They are reported, not
merged/deleted or reassigned. The two reviewed family repairs are independent of
those unresolved candidates. Future genuine slug changes use only proven managed
state and evidence-backed clan edges, retaining old tag IDs and other references.

## Finalized package

- Review-only canonical: `db/migrations/098_protect_homie_tag_identity.sql`.
  SHA-256: `ffbf357dcc0fa1e6d12cfc33818a5df2918219e742c1b678f31945a5eb9ea02f`.
- Normal execution file: `db/operations/098_apply_with_ledger.sql`.
  SHA-256: `0ef1f3f50b36bc3d47d0a58bc8d53fb11bebdc05fda495e396a37c67d73377cb`.
- Embedded assertions: `db/operations/098_identity_assertions.sql`.
  SHA-256: `512ee60cd7adf836ce9ccc76f59fbb2c27ac9895ba8a04ec83a57ce539c07969`.
- Hash manifest: `db/operations/098_apply_with_ledger.json`.
- Offline consistency check: `node scripts/prepare-homie-identity-package.mjs check`.
  For changes to still-unapplied reviewed source only, run the same script with
  `generate`, then rerun checks and review every dependent artifact/hash.

**James runs the atomic operation, not the canonical migration as another step.**
The operation updates `dojo.schema_migration` after all effects/assertions pass.
No separate ledger SQL is required. No `098_record_applied.sql` or initialization
file is supplied because neither conditional path is supported by current facts.
If exact-file execution later occurs without recording, stop for its receipt and
successful postflight before preparing guarded reconciliation. Installed effects
alone are insufficient. Matching applied records stay unchanged; conflicting or
failed history stops. On an error ROLLBACK; on an uncertain COMMIT inspect effects
and ledger before retrying. Never replay older migrations or repair unrelated gaps.

## Ordered DataGrip execution; James only

Use READ COMMITTED and the existing development/production connections. Development
write tests are not read-only probes. Keep execution receipts and before/after
outputs with the reviewed revision and hashes. The concurrency files intentionally
coordinate two consoles on the existing development connection.

| Order | Environment                              | Exact file or command                                                                     | Purpose                                                   | Expected result                                                   | Stop if                                      |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| 1     | Development, read-only                   | `db/operations/098_identity_preflight.sql`                                                | Confirm target, known state and ledger                    | All assertions pass; reviewed state or exact matching applied row | Target, definition, identity or ledger drift |
| 2     | Development, James writes                | `db/operations/098_apply_with_ledger.sql`                                                 | Effects/assertions and ledger atomically                  | One commit; canonical 098 SHA recorded                            | Any error or unknown COMMIT                  |
| 3     | Development, read-only                   | `db/operations/098_identity_postflight.sql`                                               | Verify identities, family preservation, guards and ledger | All assertions pass                                               | Any mismatch                                 |
| 4     | Development, James writes                | `db/tests/098_homie_identity_test.sql`                                                    | Rollback-only behavior checks                             | All cases pass, then rollback                                     | Any failure; ROLLBACK console                |
| 5     | Development console A, James writes      | `db/tests/098_concurrency_a_begin.sql`                                                    | Reserve fixture and hold transaction lock                 | Insert succeeds; transaction stays open                           | Occupied fixture or error                    |
| 6     | Development console B, James writes      | `db/tests/098_concurrency_b.sql`                                                          | Start conflicting athlete assignment while A is open      | Waits for A                                                       | Immediate success or unrelated error         |
| 7     | Same development console A, James writes | `db/tests/098_concurrency_a_commit.sql`                                                   | Release reservation commit while B waits                  | A commits; B rejects reserved roster identity                     | B succeeds, times out or deadlocks           |
| 8     | Same development console B               | `ROLLBACK;`                                                                               | End B's expected failed transaction                       | Console idle; no athlete/tag fixture committed                    | Uncertain transaction result                 |
| 9     | Development, James writes                | `db/tests/098_concurrency_cleanup.sql`                                                    | Remove only A's exact fixture                             | Fixture removed; no unexpected athlete/tag                        | Guard fails or unexpected state              |
| 10    | Development, read-only and app checks    | `db/operations/098_identity_postflight.sql`; inspect existing homie/family/snapshot pages | Recheck and record behavior                               | All assertions and existing app behavior pass                     | Failure or unaccepted limitation             |
| 11    | Production prerequisites, read-only      | Review dev receipts and SQL approval; `db/operations/098_identity_preflight.sql`          | Fresh production target/history/definition review         | Dev validation accepted; current SQL approval; preflight passes   | Missing approval/evidence or drift           |
| 12    | Production, James writes                 | `db/operations/098_apply_with_ledger.sql`                                                 | Apply same reviewed package and ledger                    | Atomic commit                                                     | Error or uncertain COMMIT                    |
| 13    | Production, read-only                    | `db/operations/098_identity_postflight.sql`                                               | Verify production effects and exact history               | All assertions pass                                               | Any mismatch                                 |

The rollback-only tests may advance identity/serial sequences; they leave no
fixture rows after successful rollback. Never run development fixtures or concurrency
scripts in production. Application checks use the user's existing local app;
Cipher does not start a dev server or initiate authentication/collection writes.

## What remains before deployment

Follow the SQL-first order above to deliver the database cleanup. The current
application reads the same homie/tag/snapshot columns before and after 098; no
staged application schema consumer is added. Known family URLs and numeric-route
fallback remain compatible. Actual write-path behavior, lock cost, all manual
cases and application checks still require development validation. Higher-isolation
identity writes intentionally fail; validate that existing writers use READ COMMITTED.

Cipher must verify James's receipts, read-only postflight and the exact canonical
ledger row independently after each environment's execution. Repository preparation
is complete only as preparation; database cleanup is **not completed** yet.

Release compatibility evidence remains unfinished. Vercel alias inspection on
November 15 returned 403 for scope `greek-freaks-projects`; the live production
application SHA could not be verified. `releases/deferred-schema.json` still
contains an older WU-1249 review and was deliberately not changed or treated as
valid for this package. At the actual release, establish current authorized Vercel
alias/deployment access, verify the live application baseline and compute the
complete guarded diff using `readSchemaDeferral`'s exact flags/pathspec, including
all earlier unreleased migrations/schema/Prisma changes. Refresh the record only
with reviewed SQL execution/compatibility evidence and the actual release scope.
Ledger recording does not satisfy that guard. Preserve exact-SHA CI, main stability
and human protected release approvals. No production deployment is authorized here.

Neon project metadata reports 86,400 seconds retained history. Independent backup
coverage, restore checkpoints and successful recovery rehearsal are unverified.
No new branch/snapshot/restore or recovery environment was created. James must
review these actual limitations before production approval; no restore proof or
accepted risk is invented by this handoff.

## Immediate next action and planning boundary

James: review the WU-1261 revision/hashes, then run
`db/operations/098_identity_preflight.sql` in **existing development**. If it passes,
continue the exact development sequence above and return execution/test results
for Cipher's read-only verification. Production waits for that validation and
fresh approval/preflight. Do not run the canonical migration separately.

Stop here before WU-1262. Its next planning checkpoint is D1-D6: canonical Calvin /
name-category meaning; alias consumers and old URL behavior; motivation scope,
cardinality and history; related collections versus inherited feeds/counts; exact
Calvin Reese endpoints/backfills; genealogy and relationship maintenance scope.
No proposed answer is approved and no WU-1263-or-later work has started.
