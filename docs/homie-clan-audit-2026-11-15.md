# Homie/clan audit; November 15, 2026

WU-1272 delivers a [reusable audit skill](../.agents/skills/audit-homie-clan-relationships/SKILL.md)
and an offline comparison helper. Example: “Audit my homie/clan relationships and
prepare the fixes.” Exact current-slug filters are optional. The skill's single
SELECT inventory discovers current rows instead of relying on a frozen roster.

## Observation and coverage

Independent read-only inventories refreshed at 14:30 America/Chicago covered
existing development `br-crimson-fog-ae22ws22` and production
`br-withered-snow-aea0yck6`, project `rough-bush-94516855`, database `tullyelly_db`.
The [sanitized observations](../db/audits/2026-11-15-observations.json) record both targets. Both returned identical relevant inventories: 1,223 homies, 241 named, 982 literal
backfill placeholders, 30 clans, 462 tags and 438 stored relationships.
All 239 assigned named homies and all clans have current-slug tags, matching
CardAttack kind/role/routes. No duplicate current slug, family ownership collision
or dangling stored endpoint was found. This is not a clean playing-career audit:
external research is deliberately limited to seven positive pairs below; the
remaining career combinations and existing positive evidence were not exhaustively
re-researched. All clans were structurally inspected, including empty clans.

098 is recorded applied in both targets with canonical checksum
`c7aae080b61d34d5a6e25ac861e3304153dbeb091401ec60c0f38dd46d13722d`.
Installed production synchronization/ownership functions and relationship-view
semantics were inspected. Athletes 219/lazer-face and 221/eldrid are separate from
family tags 274/the-lazer and 33/cal; both family g-league edges survive.
These observations supersede earlier pending-application notes in WU-1261;
read-only state does not prove its unrun write/concurrency behavior tests.

## Verified missing direct memberships

All 24 pairs in the [reviewed evidence](../db/audits/2026-11-15-reviewed-memberships.json)
are absent in both targets. Exact endpoint/legacy-evidence predicates from the
prepared SQL returned zero drift problems independently in both. Migration number
099 was free at preparation. Each row in the evidence includes homie/clan IDs,
current slugs, playing scope, URL and reviewed date.

| Homie ID/current slug                           | Clan ID/current slug    | Evidence                                                                                                                                    |
| ----------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 30/steph, 123/draymond-green, 311/klay-thompson | 27/splash-bros          | [Warriors retrospective](https://www.nba.com/warriors/news/warriors-talk-curry-thompson-and-green-reflect-on-collective-greatness-20231129) |
| 6/king-james                                    | 28/cavs                 | [NBA Cavaliers career record](https://www.nba.com/news/all-time-all-nba-first-team-cleveland-cavaliers)                                     |
| 1203/cp3                                        | 32/aspiration           | [Clippers franchise assists record](https://www.nba.com/clippers/news/chris-paul-sets-clippers-franchise-record-assists)                    |
| 4/brett-favre                                   | 31/purple-people-eaters | [NFL playing statistics](https://www.nfl.com/players/brett-favre/stats/career)                                                              |
| 633/aaron-jones                                 | 31/purple-people-eaters | [Vikings career record](https://www.vikings.com/team/players-roster/aaron-jones/career)                                                     |

These are career memberships, not current-roster assertions. Official evidence
was reviewed November 15, 2026; no signing-only or coaching-only pair is added.

Seventeen additional memberships are stranded on explicitly reviewed former-slug
seeds from migration 080. Each current homie ID/name/slug was reconciled with that
exact seed and its existing, evidence-bearing direct edge; name resemblance alone
was not used. Later 081/082/089/091/092/093/097 edges supply retained source evidence.

| Homie ID/current slug        | Proven former slug | Missing clans                 |
| ---------------------------- | ------------------ | ----------------------------- |
| 6/king-james                 | lebron-james       | heat-culture, purple-and-gold |
| 105/jalen                    | jalen-rose         | suns, raptors, fab-five       |
| 231/whitefish-bay            | john-henson        | bucks-n-six                   |
| 522/johnny                   | johnny-newman      | bucks-n-six                   |
| 708/moses                    | moses-malone       | bucks-n-six, rockets          |
| 344/p-funk-fsu               | patrick-williams   | noles                         |
| 187/tamarick                 | tamarick-vanover   | noles                         |
| 112/stockton                 | john-stockton      | jazz                          |
| 521/the-human-highlight-film | dominique-wilkins  | green-beer, the-monastery     |
| 115/vinsanity                | vince-carter       | suns, raptors, vancouver      |

099 copies these positive edges to current slugs and retains every old edge and
its metadata. New copies archive original edge ID/meta and identity evidence.
It neither creates aliases nor implements historical identity merging. Previously
restored destinations, including Rodman, Traylor, Juwan, Pau, Wes and Dikembe,
are already present and are not proposed again. Multiple indirect graph paths
are traversal results, not duplicates. Legacy edges retained by prior backfills
remain a separate historical cleanup question; 098 is not replayed to move them.

## Decisions and exclusions

Unassigned Tiger Woods 82 and Peter Warrick 808 remain separate from assigned
96/tiger and 309/warrick. Do not merge, delete or assign their slugs automatically.
All 982 placeholders remain untouched, including tagged placeholders
800/reuse, 1223/null and 1224/asf. Fictional subjects 38/i-am-groot, 39/wolverine,
45/americas-ass, 46/raphael, 47/donatello, 48/mikey, 49/leonardo,
62/peter-tingle, 69/deadpool and 139/dark-knight are reported separately;
no playing-career inference is made for them. Racing drivers remain athletes.

The helper flags 37 stored edges for review: 33 lack a current source homie
assignment, and four lack structured playing evidence. They are not 37 proven
incorrect memberships. Existing 65/lamelo -> t-wolves needs identity/participation
review; no deletion is prepared. Also investigate current racer 403/danny's
basketball clan edges 135, 281 and 417 to bucks-n-six, suns and jazz: migration 080 originally
used that slug for basketball identity Danny Manning, now 415/danny-manning.
Do not transfer these automatically; exact prior ownership and intended mapping
need review. A display-name match or common nickname cannot establish ownership.
Other historical positives, including surprising current roster associations,
are preserved pending source review.

Empty texans/phillies/pirates are not errors solely because they are empty.
Warriors/Cavaliers/Vikings/Clippers positives above are supported omissions, but
research does not claim those clans' complete historical rosters. No collection
counts, snapshots, rankings, family routes, memberships or custom names change.

## Two-file manual repair handoff

Prepared only; no agent database writes. James runs existing development first,
then approved production, with exactly these two complete files:

1. [099_audit_homie_clan_memberships.sql](../db/migrations/099_audit_homie_clan_memberships.sql)
2. Only after success, [099_record_applied.sql](../db/operations/099_record_applied.sql)

Stop on failure; roll back a failed transaction and do not run the ledger. If the
migration succeeds but ledger recording fails, repair recording without replaying
the migration. Matching edge reruns before recording are harmless; an already
recorded 099 stops for history/effect review. The migration requires matching 098,
locks the relevant tables, rejects changed identities/evidence, inserts only
missing direct edges and asserts complete preservation of existing rows/metadata.
The separate ledger checks those same identities/effects and checksum conflicts.
The [generated manifest](../db/operations/099_record_applied.json) pins canonical,
assertion and ledger SHA-256. The assertions source is offline engineering input,
not a third file for James to execute.

Actual application, write-producing PostgreSQL behavior tests and post-application
read-only verification remain pending. The helper's safe fixtures simulate a
repeat audit and stop proposing a pair after its direct edge exists. This does
not establish live application. Release compatibility must be reviewed against
the verified application baseline and complete guarded diff at release time;
no existing compatibility record, protected approval or deployment is changed.

## Safe validation

`SKIP_DB=true npm run verify:agent` passed: 252 suites and 2,033 tests passed;
2 suites/6 tests skipped, coverage thresholds met, and Next production build
completed. Seven final focused audit tests passed after endpoint/managed-ownership
guards were tightened. No dev server was started. The first restricted-sandbox
Jest attempt could not parse TypeScript's showConfig; the full run outside that
sandbox passed. An initial documentation link failure was fixed before that run.

Skill validation, ESLint, documentation/format checks and offline migration/ledger
hash validation passed. The exact final endpoint/evidence predicates passed
read-only in both targets; a CTE-only negative test changing homie 6's slug
rejected all three affected pairs, without changing stored data. Live SQL
mutation, idempotence, concurrency and post-application checks remain unrun.

James explicitly authorized WU-1272 on `epic/WU-1260-tag-relationships` as an
exception. Its real Jira parent remains WU-1251 under WU-1245. The commit guard
records this per-item authorization with the exact epic/branch, reason and Chicago
day; missing, stale or mismatched authorization still rejects outside-epic work.
