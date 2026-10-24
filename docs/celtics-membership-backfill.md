# Celtics membership backfill

Migration [082](../db/migrations/082_add_celtics_player_memberships.sql) adds verified
Boston Celtics playing-career memberships for 22 homies already in the database.
It uses the actual clan slug `green-beer`. It changes only `dojo.tag_relation`;
no homies, tags or clans are created, and earlier migrations are unchanged.

Read-only inspection on 2026-10-24 confirmed the Celtics clan and canonical tag in
production and refreshed development. All 22 reviewed player identities are checked
against both branches. At the time of review there were no existing Celtics
memberships. The agent has not executed the migration.

IDs resolve through the existing homie tag slugs and clan slug. Strict preflight
checks identify any missing or changed endpoint; all 22 pairs must be present
before the transaction commits. `ON CONFLICT DO NOTHING` preserves existing edge
metadata and makes reruns idempotent. These are historical and current playing
associations, following migrations 080/081; they do not describe only today's roster.
The existing membership queries include past teams in team/member lists and
Chronicle inheritance.

## Reviewed pairs and evidence

Two independent reviews compared all 228 named homie rows with primary NBA/team
playing records. NBA team roster pages may also contain historical Hall of Fame
tables. Blue Edwards is documented in a Celtics-authored media guide preserved
by an archive; the PDF source below identifies the relevant page.

| Homie             | Existing tag slug   | Primary evidence                                                                                                      |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Blue Edwards      | `blue`              | [Source](https://library.sfo2.cdn.digitaloceanspaces.com/publications/basketball/yearbooks/KBOSCMG-2014.pdf#page=100) |
| Dominique Wilkins | `dominique-wilkins` | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Gary Payton       | `the-glove`         | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Jabari Parker     | `jabari`            | [Source](https://www.nba.com/celtics/news/sidebar/post-041921-shorthanded-celtics-edged-bulls-win-streak-ends-six)    |
| Jason Terry       | `jason-terry`       | [Source](https://www.nba.com/kings/news/jason-terry-spend-remainder-season-rehabilitating-left-knee)                  |
| Jayson Tatum      | `big-deuce`         | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Jeff Teague       | `jeff`              | [Source](https://www.nba.com/bucks/news/milwaukee-bucks-sign-jeff-teague)                                             |
| Jrue Holiday      | `jrue`              | [Source](https://www.nba.com/blazers/news/trail-blazers-acquire-two-time-all-star-jrue-holiday)                       |
| Justin Jackson    | `justin-jackson`    | [Source](https://texas.gleague.nba.com/news/justin-jackson-returns-to-legends)                                        |
| Kevin Garnett     | `the-big-ticket`    | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Larry Bird        | `larry-bird`        | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Malcolm Brogdon   | `malcolm-brogdon`   | [Source](https://www.nba.com/blazers/news/trail-blazers-acquire-malcolm-brogdon-and-robert-williams-iii)              |
| Marty Conlon      | `marty-conlon`      | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                           |
| Michael Finley    | `fin-dawg`          | [Source](https://www.nba.com/raptors/news/recap_040710.html)                                                          |
| Ray Allen         | `jesus`             | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Robert Parish     | `robert-parish`     | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Sam Cassell       | `alien`             | [Source](https://www.nba.com/sixers/news/rivers-assembles-impressive-staff)                                           |
| Shaquille O'Neal  | `diesel`            | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Sherman Douglas   | `sherminator`       | [Source](https://www.nba.com/magic/news/cohen_influentialplayers_031611.html)                                         |
| Tiny Archibald    | `tiny-archibald`    | [Source](https://www.nba.com/team/1610612738/roster)                                                                  |
| Todd Day          | `day`               | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                           |
| Vin Baker         | `vin`               | [Source](https://www.nba.com/news/nba-birthdays-players-born-on-nov-23)                                               |

## Exclusions and verification

Coaching jobs, draft rights, preseason appearances and zero-game signings do not
establish playing memberships. Justin Holiday is distinct from Justin Jackson;
only Jackson's actual Boston appearances are included. Wes Matthews's older
Celtics namesake is not the 2009-drafted homie. The 1981-drafted Isiah Thomas is
not the Celtics' Isaiah Thomas. Newly added Cole Anthony and Tyler Herro had no
verified Boston playing affiliation in this review. No such identities are linked
by approximate name matching.

The [read-only SQL assertions](../db/tests/082_celtics_memberships_test.sql) are for
manual use after applying the migration. Local source tests and endpoint checks
do not establish database application. After a failed manual attempt, issue
`ROLLBACK;` before rerunning the complete file and use the reported endpoint details
to resolve any changed data.
