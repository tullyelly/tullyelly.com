# Homie/clan audit; November 19, 2026

WU-1277 is the preparation subtask of WU-1015, created at James's request. James
requested closure of both items once the migration is in place. Jira completion
records preparation only; current application evidence is recorded below and
no release is authorized.
No branch, commit, push, production write or deployment is part of this task.

## Current read-only observations

Existing project rough-bush-94516855, database tullyelly_db:

| Target      | Branch                    | Observed UTC        | Homies | Named | Clans | Tags | Stored edges |
| ----------- | ------------------------- | ------------------- | ------ | ----- | ----- | ---- | ------------ |
| Development | br-crimson-fog-ae22ws22   | 2026-11-20 02:48:56 | 1223   | 244   | 31    | 473  | 467          |
| Production  | br-withered-snow-aea0yck6 | 2026-11-20 02:49:01 | 1223   | 244   | 33    | 475  | 467          |

These timestamps are November 19 at 20:48/20:49 America/Chicago. Both targets
have ledger records for 098 through 102 with matching canonical checksums.
Installed synchronization/ownership function definitions were inspected independently.
All named assigned homies and clans have matching tags/routes/identity metadata;
no dangling endpoint or duplicate current ownership was found. Named homies are
included regardless of card counts. There are 979 literal backfill placeholders.

Production clans 34/hawks and 35/magic-kingdom were created November 19 Chicago;
33/sixers was created November 18 Chicago. All three are included because they
are new since the November 15 audit. All three have zero stored memberships.
Development has sixers, but lacks the Hawks and Magic clans and their tags.
The exact migration endpoint predicate passed in production and returned the
34 Hawks/Magic pairs in development solely because those clan endpoints are absent.
Existing development homie assignments match the reviewed pairs.

## Supported missing memberships

[Reviewed evidence](../db/audits/2026-11-19-reviewed-memberships.json) records exact
homie IDs/names/current slugs, clan IDs/names/slugs, source URLs, playing scope
and review date for all 56 missing direct professional memberships. The existing
offline audit helper confirmed all 56 absent with valid production identities.
All 24 previously reviewed November 15 direct pairs are now present; do not replay 099.

Team publications were downloaded and their historical playing roster sections
compared with all 244 current named homies. These establish historical positives,
not an exhaustive independently verified 2026 transfer feed. The 76ers source is
the [2023-24 official team guide](https://cdn.nba.com/teams/uploads/sites/1610612755/2024/01/23-24-76ers-Media-Guide-Update-compressed.pdf),
printed pages 370-453; the Hawks source is the [2020-21 official team guide, archived copy](https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KATLHMG-2021.pdf),
printed pages 192-205; the Magic source is the [2025-26 official team guide](https://magicweb.blob.core.windows.net/resources/communications/orlando-magic-media-guide-2025-26.pdf),
printed pages 172-201. Hawks Aaron Holiday participation is additionally supported
by an [official 2022 game report](https://www.nba.com/game/atl-vs-mil-0022200085),
and Wesley Matthews by his [official NBA season statistics](https://www.nba.com/players/wesley/matthews/202083).

### Philadelphia 76ers: 22 pairs

| Homie ID | Stored name     | Current slug  |
| -------- | --------------- | ------------- |
| 3        | Allen Iverson   | allen-iverson |
| 5        | Tim Thomas      | tim-thomas    |
| 7        | Toni Kukoč      | toni          |
| 13       | Glenn Robinson  | big-dog       |
| 21       | Jrue Holiday    | jrue          |
| 104      | Chris Webber    | timeout       |
| 106      | Julius Erving   | julius-erving |
| 109      | Justin Holiday  | justin        |
| 121      | Joel Embiid     | the-process   |
| 155      | Dikembe Mutombo | dikembe       |
| 213      | James Harden    | beard         |
| 217      | P.J. Tucker     | pops-junior   |
| 228      | Andrew Lang     | andrew-lang   |
| 242      | Tyrone Hill     | tyrone-hill   |
| 315      | Tobias Harris   | tobias        |
| 410      | Armen Gilliam   | armen-gilliam |
| 434      | Charles Barkley | sir-charles   |
| 608      | Joe Smith       | joe-smith     |
| 622      | Jimmy Butler    | playoff-jimmy |
| 703      | George Hill     | blm           |
| 707      | Ersan İlyasova  | charge        |
| 708      | Moses Malone    | moses         |

### Atlanta Hawks: 20 pairs

| Homie ID | Stored name       | Current slug             |
| -------- | ----------------- | ------------------------ |
| 7        | Toni Kukoč        | toni                     |
| 13       | Glenn Robinson    | big-dog                  |
| 109      | Justin Holiday    | justin                   |
| 115      | Vince Carter      | vinsanity                |
| 155      | Dikembe Mutombo   | dikembe                  |
| 203      | Aaron Holiday     | aaron-holiday            |
| 209      | Wes Matthews      | wes                      |
| 228      | Andrew Lang       | andrew-lang              |
| 303      | Bob Sura          | bob-sura                 |
| 305      | Jeff Teague       | jeff                     |
| 412      | Jabari Parker     | jabari                   |
| 415      | Danny Manning     | danny-manning            |
| 504      | Sidney Moncrief   | sidney-moncrief          |
| 521      | Dominique Wilkins | the-human-highlight-film |
| 601      | Tracy McGrady     | t-mac                    |
| 603      | Jason Terry       | jason-terry              |
| 608      | Joe Smith         | joe-smith                |
| 707      | Ersan İlyasova    | charge                   |
| 708      | Moses Malone      | moses                    |
| 903      | Ken Norman        | ken-norman               |

### Orlando Magic: 14 pairs

| Homie ID | Stored name       | Current slug             |
| -------- | ----------------- | ------------------------ |
| 115      | Vince Carter      | vinsanity                |
| 125      | Juwan Howard      | juwan                    |
| 140      | Shawn Kemp        | reign-man                |
| 150      | Cole Anthony      | cole                     |
| 301      | Anfernee Hardaway | penny                    |
| 315      | Tobias Harris     | tobias                   |
| 333      | Patrick Ewing     | the-ewing-theory         |
| 407      | Joe Ingles        | ingles                   |
| 432      | Shaquille O'Neal  | diesel                   |
| 433      | Grant Hill        | drinks-sprite            |
| 521      | Dominique Wilkins | the-human-highlight-film |
| 601      | Tracy McGrady     | t-mac                    |
| 707      | Ersan İlyasova    | charge                   |
| 1103     | Brandon Jennings  | bucks-in-six             |

## Exclusions and unresolved older findings

Gary Payton is expressly listed in the Hawks guide as on the active roster for
two games without seeing action. No Hawks membership is proposed. Tim Hardaway
Jr. in that guide is not homie 110/utep-two-step. Philadelphia's Wes Matthews was
born August 24, 1959; he is not homie 209/wes, the Marquette alumnus. Hawks homie
209 is supported separately by his 2023-24 NBA playing record. Carmelo Anthony's
Hawks transaction did not lead to playing participation; no edge is proposed.
Grant Hill's Hawks ownership is not playing membership. Danny Manning's new Hawks
pair belongs to 415/danny-manning, never racer 403/danny.

The global helper still flags 35 older stored edges: 31 with no current source
homie assignment and four lacking structured playing evidence. These are review
flags, not 35 proven incorrect edges. Existing alias consumers and retained old
edges require separate ownership review before cleanup. LeBron's old evidence
rows were merged by 102; the older evidence file's two legacy-source warnings
do not mean his current direct memberships are missing.

Racer 403/danny still carries NBA edges 135/bucks-n-six, 281/suns and 417/jazz,
originally seeded for Danny Manning. Their evidence does not establish a racing
career affiliation. This known ownership discrepancy is excluded from the additive
repair; do not transfer or delete the edges automatically. LaMelo's existing
Timberwolves edge still needs participation/identity review; it is preserved.
Unassigned 82/Tiger Woods and 808/Peter Warrick remain untouched. Ten fictional
subjects and family cal/the-lazer/g-league remain outside athlete inference.
The other clans were structurally checked, but all existing playing histories
were not independently researched again. This is not a clean global career audit.

## Applied follow-up; November 19 at 21:29 America/Chicago

1. [103_add_sixers_hawks_magic_memberships.sql](../db/migrations/103_add_sixers_hawks_magic_memberships.sql)
2. Only after success, [103_record_applied.sql](../db/operations/103_record_applied.sql)

James reports manual migration execution. Fresh independent read-only checks at
03:29 UTC November 20 confirm all 56 direct memberships with exact reviewed
playing evidence in both existing targets. Exact IDs/names/current slugs, clan
endpoints and identity metadata pass in each target. The prior missing development
Hawks/Magic endpoints are resolved. Production has the exact canonical 103 ledger
row, status applied, timestamp 2026-11-20T03:27:13.632Z and no error. Development
has no 103 ledger row; this remains a readiness gap.

**Remaining manual action:** in the existing development connection, James runs
only [103_record_applied.sql](../db/operations/103_record_applied.sql). Do not
replay the migration in either database. The ledger file independently checks
installed identities/effects before recording history; stop on any conflict.
Production needs no additional SQL for 103. Exact execution chronology and
transaction-wide preservation at James's original execution were not independently
observed; current effects and ledger state are independently verified.

[Sanitized evidence](evidence/wu-1277-applied-readonly.json) records targets and
results. [The compatibility review](schema-compatibility-review.md) now binds
READY production application d648d984 and the complete guarded diff containing
only migration 103. Files are still local and uncommitted; final release SHA/CI,
review/merge and protected human production approval remain outstanding.

The migration locks identity/relationship tables, checks exact current endpoints,
reserved ownership and prerequisite history, inserts only the 56 reviewed edges,
and asserts preservation of every existing edge, tag, homie, clan and metadata.
Unrecorded reruns preserve existing edges; recorded history stops for review.
Ledger SQL independently checks target, identities, playing evidence and effects
before recording the finalized canonical SHA-256. Conflicting history aborts.
Stop on failure and roll back the failed transaction. If migration succeeds but
ledger recording fails, investigate recording without replaying the migration.
Neither file has been executed by Cipher. Controlled write/concurrency tests and
application UI checks remain unrun. No recovery drill was performed; discovered
Neon project configuration retains 24 hours of history, which is not proof of a
tested restore or independent backup. Application compatibility evidence has
been refreshed; protected release approval remains separate and has not been bypassed.

## Validation

Database-disabled validation completed all required stages: workflow checks,
content preparation, lint, TypeScript, Prisma generation, 263 passing Jest suites
and 2,102 passing tests, with two suites/six tests skipped. Coverage passed:
88.63% statements, 81.90% branches, 86.79% functions and 90.06% lines.
The first sandboxed attempt stopped at Jest's TypeScript showConfig subprocess;
the outside-sandbox retry passed those stages. Its Next build compiled and
rendered routes, then stopped on an installed-Next.js security advisory. Retrying
only the remaining stage with SKIP_DB=true npm run build:validated passed in
20.9 seconds. The advisory remains a recommendation to upgrade the dependency;
no package versions or security policy were changed by this SQL-only task.
The original verify:agent invocation did not exit successfully; successful source
stages plus the separately completed build are the final validation evidence.

The existing offline audit helper found all 56 missing pairs, then zero after
simulating installation in memory; exclusions passed. Manual migration package
hash checks, changed-file formatting, docs:check and git diff --check passed.
No database-writing integration tests were run. Canonical SHA-256:
b334dc3145684754907a8f946613c8836623bde7ec3ba62b3ce5af6f1349e3d3.
Ledger SHA-256: a60147f0e4867dbaffce5ea316dcf7447e5b13226e23f85743c9605bd7dc22ba.
Files remain local and uncommitted; the unrelated Chronicle was preserved.
