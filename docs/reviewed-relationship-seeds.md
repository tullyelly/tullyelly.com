# Reviewed relationship examples; WU-1267

This is a prepared, unapplied package on the existing WU-1260 branch. It follows
WU-1262's accepted decisions and installed 100/101 validation/synchronization.
James executes writes; Cipher has used read-only inspection and safe checks only.

## Included rows

| Source                      | Target                              | Type                 | Verified intent                                                                                                                                     |
| --------------------------- | ----------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| lebron-james, tag 392       | king-james, tag 540/current homie 6 | alias_of             | Accepted same-person mapping; historical 080 tag and explicit 099 copies preserve the stable owner/evidence                                         |
| calvin, new alternate tag   | cal, tag 33                         | alias_of             | `silent-reflection.mdx:43` explicitly identifies nephew Calvin through tag cal; existing calvin slug/roster/homie claims are absent in both targets |
| king-james, tag 540/homie 6 | lulu, tag 1                         | collected_because_of | Accepted favorite_player reason: “I collect LeBron because he was Lulu's favorite player.”                                                          |

The new Calvin tag is only an alternate name for the existing nephew. It creates
no homie, abstract name category or inventory. The family's canonical slug/URL
stays cal; no relation equates cal/eldrid or the-lazer/lazer-face.

The readable [review manifest](evidence/wu-1267-reviewed-seeds.json) records exact
metadata, source hashes, included/excluded rows and per-usage corrections. Its
`applied: false` describes the frozen preparation review, not future execution
proof. Later application is recorded separately; do not rewrite reviewed source
or an applied migration to update status. The [independent baseline](evidence/wu-1267-readonly-seed-baseline.json)
contains matching development/production public tag/edge/owner records.

## Membership evidence reconciliation

Legacy LeBron tag 392 has Miami/Lakers edges 213 and 325. Current tag 540 has
proven copies 462 and 463, whose metadata explicitly names those original IDs and
matches their original metadata. Cavs edge 458 is unrelated and stays unchanged.
090's other-player copies are outside this batch; 099 is the relevant LeBron copy.

102 preserves the complete legacy edge (including ID/audit) in the existing
`homie_sync_merged_edges` archive on the matching current edge. It also records
the complete prior canonical row under `alias_seed_canonical_before`. It then
removes only the two proven duplicate source rows before adding the alias;
validation forbids member_of endpoints that remain aliases. Current edge IDs,
metadata/evidence and all true playing memberships survive. No group, homie,
snapshot or family membership is created or moved.

All reviewed tag/owner rows and legacy/current membership states are compared
inside the transaction. New metadata, different ownership, an occupied alternate
name, unexpected references, incomplete prior seeds/intentional removal or new
inbound relation FKs stop for review. Matching complete desired rows are no-ops;
newer reasons/evidence are never overwritten. Applied-number history stops replay.
If only ledger recording fails, fix that step without rerunning successful SQL.
UTC is transaction-local for timestamp/JSON comparisons, avoiding DataGrip client
TimeZone differences. Existing validation/audit triggers stay enabled.

From the inspected baseline, expect one new alternate tag, three new relationship
rows, two archived/removed duplicate rows and two current edge metadata updates.
The 462 memberships become 460 canonical memberships, plus two aliases and one
motivation: 463 active relationships. There is no sum of collection card counts.
Existing tags, homies and unrelated relationships are asserted unchanged.

## Reviewed Chronicle corrections

These four literal tag props are corrected; all other bytes, display labels,
frontmatter dates, prose and images are preserved and hash-checked:

| Chronicle/line        | Before                     | After      | Evidence                                                                                   |
| --------------------- | -------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| dr-jones:82           | TcdbSnapshot cal           | eldrid     | Homie 221, 2026-08-06 snapshot; 75 cards/rank 54 in both targets                           |
| section-80:22         | TcdbSnapshot cal           | eldrid     | Explicit former-Brewer paragraph; homie 221, 2026-07-02 snapshot, 74 cards/rank 53 in both |
| midnight-marauders:12 | TcdbSnapshot the-lazer     | lazer-face | Homie 219, 2026-09-27 snapshot; 2 cards/rank 24 in both; 098's proven former slug          |
| mike-vick:17          | PersonTag james tagged cal | edgerrin   | Sentence explicitly names Edgerrin James; current homie 232/tag 563 verified in both       |

The authored `james` display text and following family `calvin` TagLink remain.
The last correction changes that post's inferred athlete tag from cal to edgerrin,
rather than classifying the athlete as the nephew. TcdbSnapshot does not itself
add a PersonTag inferred tag; its corrected lookup still uses the original post
date. No global rename or displayName-derived alias harvesting occurs. All other
family/LeBron mentions remain unchanged.

## Excluded and tracked

- **Calvin Reese -> cal:** no Calvin Reese/Pokey Reese homie or established tag
  endpoint exists. TCDB's indexed [Pokey Reese listing](https://www.tcdb.com/GalleryP.cfm/pid/4852/col/1/yea/2006/Pokey-Reese)
  identifies Calvin Reese Jr., person 4852, as a candidate; the root profile fetch
  was unavailable. This does not confirm James's intended player. The specific
  confirmation question was presented while verified work continued. Keep this
  seed excluded; confirmed identity and separately authorized onboarding must
  precede a future reason. No collector/import or invented snapshot is used.
- **t-wolves -> aden/cal/the-lazer:** the authored nephews paragraph supports family
  fandom, but neither favorite_player nor shared_name describes a team-fandom
  reason accurately. This optional demonstration remains outside the two-code
  first wave; a future family_fandom code needs coordinated contract approval.
- **secret-identity:211 David Carr:** no verified existing subject tag/homie exists.
  Preserve the authored david/the-lazer usage and track endpoint/intent rather
  than create a person or equate him with the nephew.
- **midnight-marauders:46 laszlo cards PersonTag:** athlete mention versus
  nephew-inspired collection is ambiguous. Preserve that authored family tag and
  display label pending per-usage intent. The dated snapshot correction is
  independently proven and is not held up by this separate ambiguity.

These exclusions remain visibly incomplete; implemented capability is distinct
from missing example data. The owning Jira story tracks the precise follow-ups.
No new decision interview or WU-1261 cleanup replay is needed.

## James's two-file handoff

In **existing development** DataGrip, run:

1. `db/migrations/102_seed_tag_relationship_examples.sql`
2. `db/operations/102_record_applied.sql`, only after migration success.

Essential prerequisite, identity/conflict, archival and preservation assertions
are embedded. There is no wrapper or separate mandatory pre/postflight checklist.
Expect both COMMIT and one matching applied 102 ledger entry, with the three
reviewed edges and preserved metadata/memberships described above. Report both
successes or the first exact error/SQLSTATE and whether migration COMMIT occurred.
Stop/ROLLBACK on migration failure; do not run the ledger. A ledger failure after
migration success is repaired without replaying the canonical migration.

Production follows development validation and the established reviewed approval
process with the same files and fresh embedded checks. Existing 098/099/100/101
files/checksums are untouched. Alias-aware consumer code (WU-1264) and relationship
sections (WU-1265/1266) are committed locally, not deployed. Canonical owner IDs
and current memberships remain compatible; legacy alias URLs/sections require
those consumer changes. Before relying on the feature in production, review the
actual live application baseline and complete guarded diff and use protected
merge/release authorization. No compatibility record or release gate is changed.

Cipher stops before these writes, verifies reported execution read-only, and then
resumes WU-1267's remaining acceptance evidence and WU-1268 integration/maintenance.
No prepared SQL or mock UI is treated as applied, live or deployed.

## Safe validation evidence; prepared only

The final database-disabled `verify:agent` baseline passed locally in 126.3 seconds:
263 suites/2,102 tests passed, two suites/six tests skipped; unchanged thresholded
coverage and Next production build passed. Local Node is 22.18.0 versus CI pin
22.20.0; no hosted CI result is claimed. Session log: `/tmp/wu1267-verify.log`.
The source/asset `chronicle:ready` checks passed for all four corrected posts;
explicit formatting checks passed, Contentlayer regenerated and its corrected
mike-vick tags include edgerrin and exclude cal. Image manifests/assets did not
change. Seed-package tests pin reviewed rows, archival proof, exclusion/split rules,
canonical/ledger separation and the exact four source-prop changes.

Independent read-only evaluation in both targets found no endpoint baseline
mismatch, two exact legacy/current membership pairs, no 102 ledger, and no stored
alias/motivation rows. Offline PostgreSQL 17 parsing passed the canonical file
(27 statements/five PLpgSQL blocks) and ledger (12/three). Generated hash checks,
docs and diff checks passed. These are preparation/query proofs, not a live
mutation, trigger/concurrency test or migration application. All database-writing
checks remain unrun by Cipher. No dev server, seed execution, push/PR, merge or
production deployment occurred.
