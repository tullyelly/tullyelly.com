# Lakers membership backfill

Migration [081](../db/migrations/081_add_lakers_player_memberships.sql) adds verified
Lakers playing-career memberships for 20 homies already in the database. It uses
the actual clan slug `purple-and-gold`, not an assumed `lakers` slug. It follows
migration 080 and changes only `dojo.tag_relation`; it creates no homies, tags or
clans and does not alter earlier migrations.

Read-only inspection on 2026-10-24 confirmed the Lakers clan, canonical tag and
all reviewed player identities in production and the refreshed development branch.
There were no existing Lakers memberships at the time of inspection. The migration
has not been executed by the agent. It resolves IDs through the existing homie tag
slugs and clan slug, checks every endpoint, and retains existing relation metadata
with `ON CONFLICT DO NOTHING`. Rerunning it does not duplicate memberships.

These are historical and current playing affiliations, using the same career scope
as migration 080. They are not a claim that every listed player is on today's
roster. Existing identity queries include historical memberships in team/member
lists and Chronicle inheritance.

## Reviewed pairs and evidence

The two independent reviews compared all 226 named homie rows with official
NBA/Lakers playing records. Team roster pages below include historical Hall of
Fame tables as well as the current roster.

| Homie                | Existing tag slug      | Primary evidence                                                                       |
| -------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| Andrew Bogut         | `andrew-bogut`         | [Source](https://www.nba.com/lakers/releases/180106-bogut-waived)                      |
| Anthony Davis        | `ad`                   | [Source](https://www.nba.com/lakers/team/player-pages/anthony-davis-203076)            |
| Brook Lopez          | `splash-mountain`      | [Source](https://www.nba.com/news/milwaukee-bucks-sign-brook-lopez-official-release)   |
| Carmelo Anthony      | `carmelo-anthony`      | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Dennis Rodman        | `dennis-rodman`        | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Gary Payton          | `the-glove`            | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Joe Smith            | `joe-smith`            | [Source](https://www.nba.com/player/693)                                               |
| Kareem Abdul-Jabbar  | `kareem`               | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Karl Malone          | `karl-malone`          | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Kobe Bryant          | `kobe`                 | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Kostas Antetokounmpo | `kostas-antetokounmpo` | [Source](https://www.nba.com/player/1628961/kostas-antetokounmpo/stats)                |
| Lebron James         | `lebron-james`         | [Source](https://www.nba.com/news/lebron-james-lakers-legacy-closes)                   |
| Luka Doncic          | `luka`                 | [Source](https://www.nba.com/lakers/history/history-day-in-photos-lukas-first-game)    |
| Magic Johnson        | `magic`                | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Mitch Richmond       | `mitch-richmond`       | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Pau Gasol            | `pau-gasol`            | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Shaquille O'Neal     | `diesel`               | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Sterling Brown       | `sterling-brown`       | [Source](https://www.nba.com/lakers/news/stay-ready-lakers-pluck-hawks-wings-01-06-23) |
| Steve Nash           | `nash`                 | [Source](https://www.nba.com/team/1610612747/lakers/roster)                            |
| Wes Matthews         | `wes-matthews`         | [Source](https://www.nba.com/news/bucks-bring-back-veteran-wesley-matthews)            |

## Exclusions and verification

Coaching jobs, draft rights, preseason appearances and zero-game signings are not
playing memberships. P.J. Tucker, Justin Holiday, Marjon Beauchamp and John Henson
are excluded because no Lakers NBA playing record was confirmed in this review.
Isiah Thomas, Ervin Johnson and Johnny Newman are distinct from similarly named
Lakers players; their homie identities are not reused for those other people.
Wes Matthews uses the 2009-drafted son's 2020-21 Lakers record, not his father's
Lakers alumni entry.

The [read-only SQL assertions](../db/tests/081_lakers_memberships_test.sql) are for
manual use after applying the migration. Local source checks and read-only endpoint
comparisons do not establish that the migration was applied. If a manual attempt
fails, issue `ROLLBACK;` and rerun the complete file after addressing the reported
endpoint details.
