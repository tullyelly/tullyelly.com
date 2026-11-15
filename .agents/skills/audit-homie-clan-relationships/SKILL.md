---
name: audit-homie-clan-relationships
description: Audit CardAttack homie and clan identities and playing-career memberships, research discrepancies, and prepare manual SQL repairs.
---

Use for “Audit my homie/clan relationships and prepare the fixes.” Default to all
named homies and clans, including zero-card subjects; optional exact current slugs
restrict findings. Read AGENTS.md, latest WU-1261 comments and implementation,
[prior reconciliation](../../../docs/homie-clan-reconciliation.md),
[playing-career rules](../../../docs/player-clan-membership-backfill.md) and
[graph semantics](../../../docs/tag-relationships-view.md). Main can lag local work.

1. Discover authorized existing targets and inspect live definitions read-only.
   Run [inventory.sql](inventory.sql) separately on development and production;
   save each returned `inventory` object as temporary JSON. No runners, writes,
   imports, credentials, environment/branch changes or live write tests.
2. Run `node scripts/audit-homie-clan-relationships.mjs INVENTORY REVIEWED`.
   REVIEWED follows [the initial evidence](../../../db/audits/2026-11-15-reviewed-memberships.json).
   Optional `--homie CURRENT_SLUG` and `--clan CURRENT_SLUG` filter findings;
   discovery totals remain global. Refresh evidence and current assignments;
   dated review files are not proof of present database state.
3. Review missing/mismatched endpoints, metadata, conflicting ownership and
   stranded direct edges. Report placeholders, unassigned/duplicate identities
   and confirmed non-athletes separately. No card-count exclusion or invented
   identity. Former-slug ownership requires recorded homie ownership or an
   explicit reviewed migration seed with unique current identity and no conflict;
   similar names alone are insufficient. Unowned legacy tags need investigation.
4. Research plausible missing/questionable memberships using official team,
   league and university records. Keep URL, reviewed date, professional/college
   scope and playing participation. Former teams and supported franchise
   predecessors count; draft rights, coaching and unplayed signings do not.
   Empty clans alone are not errors. View paths are not duplicate stored edges;
   do not sum overlapping relationships into unique card ownership.
5. Report exact IDs/current slugs, target/time, verified discrepancies, decisions,
   exclusions and research coverage. Incomplete research/access is never a clean
   audit. Preserve custom slugs/labels, metadata and historical memberships.
   Keep family cal/the-lazer and g-league distinct from athletes eldrid/lazer-face.
   Confirm 098 installed state; reuse its synchronization behavior. No competing
   trigger, undecided alias/motivation model, UI or snapshot/ranking changes.
6. For proven repairs use the database-migrations skill and
   [two-file procedure](../../../docs/manual-migrations.md): next free numbered
   transactional migration, then separate ledger only after success. Embed fresh
   endpoint/history/effect/preservation checks, retain evidence/custom metadata,
   reject drift and make reruns safe. No empty migrations or uncertain deletions.
   James executes development then approved production. Reaudit independently;
   present direct edges must no longer be proposed. Prepared is not applied.

The helper is offline. It compares structure and reviewed positive pairs; it
cannot establish exhaustive careers or resolve ambiguous people. No scheduled
service, automatic writes or deployment. See the
[initial audit](../../../docs/homie-clan-audit-2026-11-15.md) for coverage and limitations.
