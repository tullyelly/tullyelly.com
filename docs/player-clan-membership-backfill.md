# Player and clan membership backfill

Production was read through the Neon read-only connector on 2026-10-24. No
migration was executed. The snapshot contained 1,221 homie rows: 226 named rows
and 995 rows literally named `backfill`. There were 289 tags, 18 clans and 88
existing tag relationships. All 18 clans already had matching slug-based tags.

The named rows included 111 assigned tag identities and 115 without `tag_slug`.
Migration [080](../db/migrations/080_populate_player_clan_memberships.sql) assigns
113 unambiguous full-name slugs through the existing homie synchronization trigger.
Its identity seed also includes the reviewed `dell` and `tobias` aliases, so an
older branch can receive those missing assignments without changing production's
existing assignments. There are 115 identity seeds in the revised migration.
It retains every existing assigned identity. Two untagged duplicate-name rows are
held for review rather than given a second competing identity.

There are 214 reviewed player-to-team pairs for 143 players across
15 existing clans: 4 pairs already exist and 210 are missing in the
snapshot. Newly created relationships use `member_of`, directed from player to
team, and retain their evidence URL and college/professional scope in metadata.
Existing relationships and their metadata are preserved. The two reviewed reference
clans `blazers` and `suns` are inserted only if missing in an older branch; their
existing production rows remain unchanged.

The original read-only production comparison validated the 113 new identity seeds
and all 214 membership seeds, including the four existing pairs. The revised
115-seed comparison is recorded below. These checks inspect preconditions without
executing the migration.

## Interpretation and execution

Run the complete SQL file after the prerequisite migrations through 079 have been
reviewed. It creates no permanent tables or functions. It locks the three identity
tables briefly to keep validation and writes consistent, resolves IDs at execution,
and fails the transaction for missing endpoints, changed identities, duplicate-name
ambiguity, an unavailable tag trigger or a newly conflicting slug. Repeating it
preserves existing tags, assigned homie slugs and relationship metadata.

### Older development copies

A failed development run on 2026-10-24 stopped at the strict endpoint check.
Read-only inspection confirmed that development lacked the `blazers` and `suns`
clans and their tags, and its Dell Curry and Tobias Harris rows had null tag slugs.
Production had all four identities. The revised migration fills those exact gaps
using the existing clan/homie tag triggers; it keeps all 214 reviewed pairs.
For an existing reference clan whose tag alone is missing, it invokes migration
079's non-destructive tag helper. Conflicting existing identities still stop the
transaction. Endpoint failures now identify each affected player, source slug,
clan slug and missing or changed component in the database error's `DETAIL`.

After a failed attempt, issue `ROLLBACK;` in the failed session, then execute the
complete revised migration. Do not resume from the failed `DO` block or ignore
its errors. No automatic rollback is included, so unrelated pending session work
is not silently discarded.

Read-only checks of the revised 115 identity seeds and 214 membership seeds found
no remaining identity/endpoint gaps or slug collisions on either branch once the
explicit reference seeds are accounted for. Development needs 115 assignments
and the two reference clans; production needs 113 assignments and no clan inserts.
The migration itself and its read-only post-application assertions have not been
executed against either database by the agent.

These are verified career and college affiliations, not a current roster model.
The site's existing membership queries do not filter relation metadata by date;
former teams intentionally remain visible and contribute to Chronicle inheritance.
Draft-rights-only acquisitions, coaching-only jobs and signings without player
participation are excluded. Direct franchise predecessors are included: Jon
McGlocklin played for the San Diego Rockets, the same franchise now in Houston. No new inferred memberships are proposed for
`texans`, `phillies` or `pirates`.

The [read-only SQL checks](../db/tests/080_player_clan_memberships_test.sql) can be
run manually after applying 080. Local source tests validate the seed and migration
contracts; they do not establish that SQL has been applied to a database.

## Records held for review

- Peter Warrick has two homie rows with the same name and draft year. The existing
  tagged `warrick` identity is used; the duplicate untagged row is unchanged.
- Tiger Woods has two homie rows with different draft years, 1996 and 2001. The
  existing `tiger` identity is preserved; the untagged duplicate is unchanged.
- The 995 literal `backfill` rows, including one assigned `reuse` tag, are excluded.
  This migration does not delete domain records or their dependent data.
- `Cal Eldrid` appears to be a misspelled baseball player name, but its assigned
  `cal` tag points at `/unclejimmy/fam/cal` and is already a member of `g-league`.
  The identities are ambiguous, so no Brewers link is added to that family tag.
- Existing spellings such as `Wayne Gretsky` and `Nathan McKinnon` are preserved.
  The new full-name slugs follow those stored names; correcting names or reassigning
  established aliases needs a separate review.
- The existing `lamelo` to `t-wolves` link is valid in the live 2026 roster and is
  preserved, as are `ant-man` to `t-wolves`, `barnes` to `noles`, and `fin-dawg` to
  `bucky`. Earlier assumptions based on older rosters are not used.

## Team totals

| Clan                                  | Reviewed pairs | Already present | Missing in snapshot |
| ------------------------------------- | -------------: | --------------: | ------------------: |
| Houston Astros (`astros`)             |              1 |               0 |                   1 |
| Portland Trail Blazers (`blazers`)    |             12 |               0 |                  12 |
| Milwaukee Brewers (`brew-crew`)       |              5 |               0 |                   5 |
| Milwaukee Bucks (`bucks-n-six`)       |             76 |               0 |                  76 |
| Wisconsin Badgers (`bucky`)           |              2 |               1 |                   1 |
| Washington Capitals (`capitals`)      |              1 |               0 |                   1 |
| Oregon Ducks (`ducks`)                |              1 |               0 |                   1 |
| Philadelphia Eagles (`eagles`)        |              2 |               0 |                   2 |
| Miami Heat (`heat-culture`)           |             21 |               0 |                  21 |
| Green Bay Packers (`lombardi`)        |             13 |               0 |                  13 |
| Florida State Seminoles (`noles`)     |             15 |               1 |                  14 |
| Washington Football Team (`redskins`) |              2 |               0 |                   2 |
| Houston Rockets (`rockets`)           |             23 |               0 |                  23 |
| Phoenix Suns (`suns`)                 |             24 |               0 |                  24 |
| Minnesota Timberwolves (`t-wolves`)   |             16 |               2 |                  14 |

## Named homie comparison

Every named production homie row is represented below. An empty affiliation cell
means there is no reviewed match in this migration, not that the person has never
played for another team. Only teams already in `dojo.clan` are in scope.

| Homie                   | Tag identity              | Identity action | Reviewed clan slugs                                   |
| ----------------------- | ------------------------- | --------------- | ----------------------------------------------------- |
| AJ Green                | `dairy-bird`              | Existing        | `bucks-n-six`                                         |
| Aaron Holiday           | `aaron-holiday`           | Create          | `rockets`, `suns`                                     |
| Aaron Jones             | `aaron-jones`             | Create          | `lombardi`                                            |
| Aaron Rodgers           | `aaron-rodgers`           | Create          | `lombardi`                                            |
| Allen Iverson           | `allen-iverson`           | Create          |                                                       |
| Alonzo Mourning         | `zo`                      | Existing        | `heat-culture`                                        |
| Alvin Robertson         | `alvin-robertson`         | Create          | `bucks-n-six`                                         |
| Andre Jackson Jr.       | `ajax`                    | Existing        | `bucks-n-six`                                         |
| Andrew Bogut            | `andrew-bogut`            | Create          | `bucks-n-six`                                         |
| Andrew Lang             | `andrew-lang`             | Create          | `bucks-n-six`, `suns`, `t-wolves`                     |
| Anfernee Hardaway       | `penny`                   | Existing        | `heat-culture`, `suns`                                |
| Anthony Davis           | `ad`                      | Existing        |                                                       |
| Anthony Edwards         | `ant-man`                 | Existing        | `t-wolves`                                            |
| Anthony Mason           | `anthony-mason`           | Create          | `bucks-n-six`, `heat-culture`                         |
| Armen Gilliam           | `armen-gilliam`           | Create          | `bucks-n-six`, `suns`                                 |
| Bam Adebayo             | `bam`                     | Existing        | `heat-culture`                                        |
| Barry Sanders           | `barry`                   | Existing        |                                                       |
| Batman                  | `dark-knight`             | Existing        |                                                       |
| Blue Edwards            | `blue`                    | Existing        | `bucks-n-six`, `heat-culture`                         |
| Bo Jackson              | `bo-jackson`              | Create          |                                                       |
| Bob Dandridge           | `bob-dandridge`           | Create          | `bucks-n-six`                                         |
| Bob Sura                | `bob-sura`                | Create          | `noles`, `rockets`                                    |
| Bobby Portis            | `bobby`                   | Existing        | `bucks-n-six`                                         |
| Brandon Jennings        | `bucks-in-six`            | Existing        | `bucks-n-six`                                         |
| Brett Favre             | `brett-favre`             | Create          | `lombardi`                                            |
| Brook Lopez             | `splash-mountain`         | Existing        | `bucks-n-six`                                         |
| Bryn Forbes             | `bryn-forbes`             | Create          | `bucks-n-six`, `t-wolves`                             |
| Buster Posey            | `buster-posey`            | Create          | `noles`                                               |
| Caitlin Clark           | `caitlin`                 | Existing        |                                                       |
| Cal Eldrid              | `cal`                     | Existing        |                                                       |
| Cal Ripken Jr.          | `cal-ripken-jr`           | Create          |                                                       |
| Cale Makar              | `cale-makar`              | Create          |                                                       |
| Calvin Johnson          | `calvin-johnson`          | Create          |                                                       |
| Captain America         | `americas-ass`            | Existing        |                                                       |
| Carmelo Anthony         | `carmelo-anthony`         | Create          | `blazers`, `rockets`                                  |
| Charles Barkley         | `sir-charles`             | Existing        | `rockets`, `suns`                                     |
| Charles Woodson         | `charles-woodson`         | Create          | `lombardi`                                            |
| Charlie Ward            | `charlie-ward`            | Create          | `noles`, `rockets`                                    |
| Chet Holmgren           | `impossible-chet`         | Existing        |                                                       |
| Chris Bosh              | `chris-bosh`              | Create          | `heat-culture`                                        |
| Chris Mullin            | `chris-mullin`            | Create          |                                                       |
| Chris Paul              | `cp3`                     | Existing        | `rockets`, `suns`                                     |
| Chris Webber            | `timeout`                 | Existing        |                                                       |
| Chuck Cecil             | `chuck-cecil`             | Create          | `lombardi`                                            |
| Clyde Drexler           | `clyde-drexler`           | Create          | `blazers`, `rockets`                                  |
| Connor McDavid          | `connor-mcdavid`          | Create          |                                                       |
| Cooper Flagg            | `capture-the-flagg`       | Existing        |                                                       |
| D.J. Wilson             | `dj`                      | Existing        | `bucks-n-six`, `rockets`                              |
| Dale Ellis              | `dale-ellis`              | Create          | `bucks-n-six`                                         |
| Dame Lillard            | `dame-time`               | Existing        | `blazers`, `bucks-n-six`                              |
| Daniel Ricciardo        | `daniel-ricciardo`        | Create          |                                                       |
| Danny Manning           | `danny`                   | Existing        | `bucks-n-six`, `suns`                                 |
| Davante Adams           | `davante-adams`           | Create          | `lombardi`                                            |
| David Robinson          | `the-admiral`             | Existing        |                                                       |
| Deadpool                | `deadpool`                | Existing        |                                                       |
| Deion Sanders           | `primetime`               | Existing        | `noles`, `redskins`                                   |
| Dell Curry              | `dell`                    | Existing        | `bucks-n-six`                                         |
| Dennis Rodman           | `dennis-rodman`           | Create          |                                                       |
| Derrick Brooks          | `derrick-brooks`          | Create          | `noles`                                               |
| Desmond Howard          | `desmond-howard`          | Create          | `lombardi`, `redskins`                                |
| Desmond Mason           | `desmond-mason`           | Create          | `bucks-n-six`                                         |
| Devin Vassell           | `devin`                   | Existing        | `noles`                                               |
| Dikembe Mutombo         | `dikembe-mutombo`         | Create          | `rockets`                                             |
| Dirk Nowitzki           | `dirk-nowitzki`           | Create          |                                                       |
| Dominique Wilkins       | `dominique-wilkins`       | Create          |                                                       |
| Donatello               | `donatello`               | Existing        |                                                       |
| Donte DiVincenzo        | `white-donte`             | Existing        | `bucks-n-six`, `t-wolves`                             |
| Draymond Green          | `draymond-green`          | Create          |                                                       |
| Dwyane Wade             | `flash`                   | Existing        | `heat-culture`                                        |
| Dāvis Bertāns           | `davis-bertans`           | Create          |                                                       |
| Edgar Bennett           | `edgar-bennett`           | Create          | `lombardi`, `noles`                                   |
| Edgerrin James          | `edgerrin-james`          | Create          |                                                       |
| Eric Bledsoe            | `bledsoe`                 | Existing        | `bucks-n-six`, `suns`                                 |
| Eric Davis              | `eric-davis`              | Create          |                                                       |
| Eric Murdock            | `murdock`                 | Existing        | `bucks-n-six`, `heat-culture`                         |
| Ersan İlyasova          | `charge`                  | Existing        | `bucks-n-six`                                         |
| Ervin Johnson           | `ervin-johnson`           | Create          | `bucks-n-six`, `t-wolves`                             |
| Fat Lever               | `fat-lever`               | Create          | `blazers`                                             |
| Gary Payton             | `the-glove`               | Existing        | `bucks-n-six`, `heat-culture`                         |
| George Hill             | `blm`                     | Existing        | `bucks-n-six`                                         |
| Giannis Antetokounmpo   | `freak`                   | Existing        | `bucks-n-six`, `heat-culture`                         |
| Glenn Robinson          | `big-dog`                 | Existing        | `bucks-n-six`                                         |
| Grant Hill              | `drinks-sprite`           | Existing        | `suns`                                                |
| Grayson Allen           | `grayson`                 | Existing        | `bucks-n-six`, `suns`                                 |
| Greg Maddux             | `greg-maddux`             | Create          |                                                       |
| Groot                   | `i-am-groot`              | Existing        |                                                       |
| Hakeem Olajuwon         | `the-dream`               | Existing        | `rockets`                                             |
| Isiah Thomas            | `isiah-thomas`            | Create          |                                                       |
| Ja Morant               | `ja-morant`               | Create          | `blazers`                                             |
| Jabari Parker           | `jabari`                  | Existing        | `bucks-n-six`                                         |
| Jack Sikma              | `jack-sikma`              | Create          | `bucks-n-six`                                         |
| Jalen Rose              | `jalen-rose`              | Create          | `suns`                                                |
| James Harden            | `beard`                   | Existing        | `rockets`                                             |
| James Lofton            | `james-lofton`            | Create          | `eagles`, `lombardi`                                  |
| Jaromir Jagr            | `jagr`                    | Existing        | `capitals`                                            |
| Jason Kidd              | `j-kidd`                  | Existing        | `suns`                                                |
| Jason Terry             | `jason-terry`             | Create          | `bucks-n-six`, `rockets`                              |
| Jayson Tatum            | `big-deuce`               | Existing        |                                                       |
| Jeff Teague             | `jeff`                    | Existing        | `bucks-n-six`, `t-wolves`                             |
| Jimmy Butler            | `playoff-jimmy`           | Existing        | `heat-culture`, `t-wolves`                            |
| Joe Dumars              | `joe-dumars`              | Create          |                                                       |
| Joe Ingles              | `ingles`                  | Existing        | `bucks-n-six`, `t-wolves`                             |
| Joe Montana             | `joe-montana`             | Create          |                                                       |
| Joe Pavelski            | `joe-pavelski`            | Create          | `bucky`                                               |
| Joe Sakic               | `joe-sakic`               | Create          |                                                       |
| Joe Smith               | `joe-smith`               | Existing        | `bucks-n-six`, `t-wolves`                             |
| Joel Embiid             | `the-process`             | Existing        |                                                       |
| John Henson             | `john-henson`             | Create          | `bucks-n-six`                                         |
| John Stockton           | `john-stockton`           | Create          |                                                       |
| Johnny Newman           | `johnny-newman`           | Create          | `bucks-n-six`                                         |
| Jon McGlocklin          | `jon-mcglocklin`          | Create          | `bucks-n-six`, `rockets`                              |
| Jordan Nwora            | `nwora`                   | Existing        | `bucks-n-six`                                         |
| Jrue Holiday            | `jrue`                    | Existing        | `blazers`, `bucks-n-six`                              |
| Julius Erving           | `julius-erving`           | Create          |                                                       |
| Justin Holiday          | `justin`                  | Existing        |                                                       |
| Justin Jackson          | `justin-jackson`          | Create          | `bucks-n-six`, `suns`, `t-wolves`                     |
| Juwan Howard            | `juwan-howard`            | Create          | `blazers`, `heat-culture`, `rockets`                  |
| Kareem Abdul-Jabbar     | `kareem`                  | Existing        | `bucks-n-six`                                         |
| Karl Malone             | `karl-malone`             | Create          |                                                       |
| Karl-Anthony Towns      | `karl-anthony-towns`      | Create          | `t-wolves`                                            |
| Kawhi Leonard           | `kwhhyyy`                 | Existing        |                                                       |
| Ken Griffey Jr.         | `ken-griffey-jr`          | Create          |                                                       |
| Ken Norman              | `ken-norman`              | Create          | `bucks-n-six`                                         |
| Kevin Durant            | `kd`                      | Existing        | `rockets`, `suns`                                     |
| Kevin Garnett           | `the-big-ticket`          | Existing        | `t-wolves`                                            |
| Khris Middleton         | `let-khris-cook`          | Existing        | `bucks-n-six`                                         |
| Klay Thompson           | `klay-thompson`           | Create          |                                                       |
| Kobe Bryant             | `kobe`                    | Existing        |                                                       |
| Kostas Antetokounmpo    | `kostas-antetokounmpo`    | Create          |                                                       |
| LaMelo Ball             | `lamelo`                  | Existing        | `t-wolves`                                            |
| Larry Bird              | `larry-bird`              | Create          |                                                       |
| Larry Johnson           | `grandmama`               | Existing        |                                                       |
| Lawrence Taylor         | `lawrence-taylor`         | Create          |                                                       |
| Lebron James            | `lebron-james`            | Create          | `heat-culture`                                        |
| Lee Mayberry            | `mayberry`                | Existing        | `bucks-n-six`                                         |
| Leon Draisaitl          | `leon-draisaitl`          | Create          |                                                       |
| Leonardo                | `leonardo`                | Existing        |                                                       |
| Leroy Butler            | `leroy-butler`            | Create          | `lombardi`, `noles`                                   |
| Luka Doncic             | `luka`                    | Existing        |                                                       |
| László Kleinheisler     | `the-lazer`               | Existing        |                                                       |
| Magic Johnson           | `magic`                   | Existing        |                                                       |
| Malcolm Brogdon         | `malcolm-brogdon`         | Create          | `blazers`, `bucks-n-six`                              |
| Mario Lemieux           | `mario-lemieux`           | Create          |                                                       |
| Marjon Beauchamp        | `marjon`                  | Existing        | `bucks-n-six`                                         |
| Marques Johnson         | `marques-johnson`         | Create          | `bucks-n-six`                                         |
| Marty Conlon            | `marty-conlon`            | Create          | `bucks-n-six`, `heat-culture`                         |
| Michael Finley          | `fin-dawg`                | Existing        | `bucky`, `suns`                                       |
| Michael Jordan          | `mike`                    | Existing        |                                                       |
| Michael Redd            | `redd`                    | Existing        | `bucks-n-six`, `suns`                                 |
| Michaelangelo           | `mikey`                   | Existing        |                                                       |
| Mitch Richmond          | `mitch-richmond`          | Create          |                                                       |
| Moses Malone            | `moses-malone`            | Create          | `bucks-n-six`, `rockets`                              |
| Nathan McKinnon         | `nathan-mckinnon`         | Create          |                                                       |
| Nikola Jokić            | `joker`                   | Existing        |                                                       |
| Nolan Ryan              | `nolan-ryan`              | Create          | `astros`                                              |
| Oscar Robertson         | `big-o`                   | Existing        | `bucks-n-six`                                         |
| P.J. Tucker             | `pops-junior`             | Existing        | `bucks-n-six`, `heat-culture`, `rockets`, `suns`      |
| Pat Connaughton         | `project-pat`             | Existing        | `blazers`, `bucks-n-six`                              |
| Patrick Ewing           | `the-ewing-theory`        | Existing        |                                                       |
| Patrick Williams        | `patrick-williams`        | Create          | `noles`                                               |
| Pau Gasol               | `pau-gasol`               | Create          | `bucks-n-six`                                         |
| Paul Molitor            | `paul-molitor`            | Create          | `brew-crew`                                           |
| Peter Warrick           | `warrick`                 | Duplicate held  | `noles`                                               |
| Peter Warrick           | `warrick`                 | Existing        | `noles`                                               |
| Peyton Manning          | `peyton-manning`          | Create          |                                                       |
| Prince Fielder          | `prince`                  | Existing        | `brew-crew`                                           |
| Raekwon Davis           | `raekwon-davis`           | Create          |                                                       |
| Raphael                 | `raphael`                 | Existing        |                                                       |
| Ray Allen               | `jesus`                   | Existing        | `bucks-n-six`, `heat-culture`                         |
| Reggie Bush             | `reggie-bush`             | Create          |                                                       |
| Reggie Miller           | `reggie-miller`           | Create          |                                                       |
| Reggie White            | `reggie-white`            | Create          | `eagles`, `lombardi`                                  |
| Rickie Weeks            | `rickie-weeks`            | Create          | `brew-crew`                                           |
| Ricky Pierce            | `ricky-pierce`            | Create          | `bucks-n-six`                                         |
| Robert Parish           | `robert-parish`           | Create          |                                                       |
| Robin Yount             | `robin-yount`             | Create          | `brew-crew`                                           |
| Ryan Braun              | `ryan-braun`              | Create          | `brew-crew`                                           |
| Sam Cassell             | `alien`                   | Existing        | `bucks-n-six`, `noles`, `rockets`, `suns`, `t-wolves` |
| Sam Merrill             | `sam`                     | Existing        | `bucks-n-six`                                         |
| Scottie Barnes          | `barnes`                  | Existing        | `noles`                                               |
| Scottie Pippen          | `scottie-pippen`          | Create          | `blazers`, `rockets`                                  |
| Shai Gilgeous-Alexander | `shai-gilgeous-alexander` | Create          |                                                       |
| Shaquille O'Neal        | `diesel`                  | Existing        | `heat-culture`, `suns`                                |
| Shawn Kemp              | `reign-man`               | Existing        | `blazers`                                             |
| Shawn Respert           | `shawn-respert`           | Create          | `bucks-n-six`, `suns`                                 |
| Sherman Douglas         | `sherminator`             | Existing        | `bucks-n-six`, `heat-culture`                         |
| Sidney Crosby           | `sidney-crosby`           | Create          |                                                       |
| Sidney Moncrief         | `sidney-moncrief`         | Create          | `bucks-n-six`                                         |
| Spider-Man              | `peter-tingle`            | Existing        |                                                       |
| Spike Owen              | `spike-owen`              | Create          |                                                       |
| Stephen Curry           | `steph`                   | Existing        |                                                       |
| Sterling Brown          | `sterling-brown`          | Create          | `bucks-n-six`, `rockets`                              |
| Sterling Sharpe         | `sterling`                | Existing        | `lombardi`                                            |
| Steve Nash              | `nash`                    | Existing        | `suns`                                                |
| T.J. Ford               | `t-j-ford`                | Create          | `bucks-n-six`                                         |
| Tamarick Vanover        | `tamarick-vanover`        | Create          | `noles`                                               |
| Teemu Selanne           | `teemu`                   | Existing        |                                                       |
| Terence Davis II        | `terence`                 | Existing        |                                                       |
| Terrell Brandon         | `t-brandon`               | Existing        | `bucks-n-six`, `ducks`, `t-wolves`                    |
| Terrell Buckley         | `terrell-buckley`         | Create          | `lombardi`, `noles`                                   |
| Terrell Davis           | `td`                      | Existing        |                                                       |
| Thanasis Antetokounmpo  | `thanasty`                | Existing        | `bucks-n-six`                                         |
| Thon Maker              | `thon-maker`              | Create          | `bucks-n-six`                                         |
| Tiger Woods             | `tiger`                   | Duplicate held  |                                                       |
| Tiger Woods             | `tiger`                   | Existing        |                                                       |
| Tim Duncan              | `timmy`                   | Existing        |                                                       |
| Tim Hardaway            | `tim-hardaway`            | Create          | `heat-culture`                                        |
| Tim Thomas              | `tim-thomas`              | Existing        | `bucks-n-six`, `suns`                                 |
| Tiny Archibald          | `tiny-archibald`          | Create          | `bucks-n-six`                                         |
| Tobias Harris           | `tobias`                  | Existing        | `bucks-n-six`                                         |
| Todd Day                | `day`                     | Existing        | `bucks-n-six`, `heat-culture`, `suns`, `t-wolves`     |
| Toni Kukoč              | `toni`                    | Existing        | `bucks-n-six`                                         |
| Tony Bennett            | `tony-bennett`            | Existing        |                                                       |
| Tractor Traylor         | `tractor-traylor`         | Create          | `bucks-n-six`                                         |
| Tracy McGrady           | `t-mac`                   | Existing        | `rockets`                                             |
| Tyrese Haliburton       | `tyrese`                  | Existing        |                                                       |
| Tyrone Hill             | `tyrone-hill`             | Create          | `bucks-n-six`, `heat-culture`                         |
| Victor Wembanyama       | `victor-wembanyama`       | Create          |                                                       |
| Vin Baker               | `vin`                     | Existing        | `bucks-n-six`, `rockets`                              |
| Vince Carter            | `vince-carter`            | Create          | `suns`                                                |
| Warrick Dunn            | `warrick-dunn`            | Create          | `noles`                                               |
| Wayne Gretsky           | `wayne-gretsky`           | Create          |                                                       |
| Wes Matthews            | `wes-matthews`            | Create          | `blazers`, `bucks-n-six`                              |
| Wolverine               | `wolverine`               | Existing        |                                                       |
| Yao Ming                | `yo`                      | Existing        | `rockets`                                             |
| Zion Williamson         | `injured`                 | Existing        |                                                       |

## Membership evidence

Evidence is stored per proposed relationship in the migration. All entries use
primary league, team or university sources; roster pages may also contain historical
Hall of Fame tables. The evidence is a dated review, not an automated roster feed.

| Homie tag            | Clan           | Scope        | Primary evidence                                                                                                         |
| -------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `nolan-ryan`         | `astros`       | professional | [Source](https://www.mlb.com/astros/history/hall-of-fame/inductees)                                                      |
| `carmelo-anthony`    | `blazers`      | professional | [Source](https://www.nba.com/team/1610612757/blazers/roster)                                                             |
| `clyde-drexler`      | `blazers`      | professional | [Source](https://www.nba.com/team/1610612757/blazers/roster)                                                             |
| `dame-time`          | `blazers`      | professional | [Source](https://www.nba.com/news/bucks-waive-damian-lillard)                                                            |
| `fat-lever`          | `blazers`      | professional | [Source](https://www.nba.com/news/denver-nuggets-all-time-steals-leaders)                                                |
| `ja-morant`          | `blazers`      | professional | [Source](https://www.nba.com/gamenotes/blazers.pdf)                                                                      |
| `jrue`               | `blazers`      | professional | [Source](https://www.nba.com/player/201950/jrue-holiday)                                                                 |
| `juwan-howard`       | `blazers`      | professional | [Source](https://www.nba.com/game/den-vs-por-0020900018/box-score)                                                       |
| `malcolm-brogdon`    | `blazers`      | professional | [Source](https://statsdmz.nba.com/pdfs/20240105/20240105_PORDAL_book.pdf)                                                |
| `project-pat`        | `blazers`      | professional | [Source](https://www.nba.com/blazers/news/trail-blazers-look-end-two-year-losing-streak-bucks-tuesday-night)             |
| `scottie-pippen`     | `blazers`      | professional | [Source](https://www.nba.com/team/1610612757/blazers/roster)                                                             |
| `reign-man`          | `blazers`      | professional | [Source](https://cdn-uat.nba.com/news/all-time-starting-5-indiana-raised-players)                                        |
| `wes-matthews`       | `blazers`      | professional | [Source](https://www.nba.com/blazers/news/player-profile-wesley-matthews)                                                |
| `paul-molitor`       | `brew-crew`    | professional | [Source](https://baseballhall.org/hall-of-famers/molitor-paul)                                                           |
| `prince`             | `brew-crew`    | professional | [Source](https://www.mlb.com/player/prince-fielder-425902)                                                               |
| `rickie-weeks`       | `brew-crew`    | professional | [Source](https://www.mlb.com/news/mariners-sign-rickie-weeks-to-major-league-contract/c-109225802)                       |
| `robin-yount`        | `brew-crew`    | professional | [Source](https://baseballhall.org/hall-of-famers/yount-robin)                                                            |
| `ryan-braun`         | `brew-crew`    | professional | [Source](https://www.mlb.com/brewers/press-release/press-release-ryan-braun-announces-retirement)                        |
| `dairy-bird`         | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20260319/20260319_MILUTA_book.pdf)                                                |
| `alvin-robertson`    | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `ajax`               | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20260319/20260319_MILUTA_book.pdf)                                                |
| `andrew-bogut`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `andrew-lang`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `anthony-mason`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-starters)                                                             |
| `armen-gilliam`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `blue`               | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `bob-dandridge`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `bobby`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `bucks-in-six`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/news/bucks-sign-brandon-jennings-10-day-contract)                                     |
| `splash-mountain`    | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `bryn-forbes`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `dj`                 | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `dale-ellis`         | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-130125)                                                               |
| `dame-time`          | `bucks-n-six`  | professional | [Source](https://www.nba.com/news/bucks-waive-damian-lillard)                                                            |
| `danny`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/news/nba-birthdays-players-born-on-may-17)                                                  |
| `dell`               | `bucks-n-six`  | professional | [Source](https://jr.nba.com/so-who-is-stephen-currys-dad/)                                                               |
| `desmond-mason`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-starters)                                                             |
| `white-donte`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `bledsoe`            | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `murdock`            | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `charge`             | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181209/20181209_MILTOR.pdf)                                                     |
| `ervin-johnson`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/player/911)                                                                                 |
| `the-glove`          | `bucks-n-six`  | professional | [Source](https://www.nba.com/news/trade-deadline-deals-all-time-history)                                                 |
| `blm`                | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `freak`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `big-dog`            | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `grayson`            | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks)                                              |
| `jabari`             | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `jack-sikma`         | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/mb-130415)                                                                   |
| `jason-terry`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/release/bucks-re-sign-jason-terry)                                                    |
| `jeff`               | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `ingles`             | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks)                                              |
| `joe-smith`          | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-starters)                                                             |
| `john-henson`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-130420)                                                               |
| `johnny-newman`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `jon-mcglocklin`     | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `nwora`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `jrue`               | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `justin-jackson`     | `bucks-n-six`  | professional | [Source](https://www.nba.com/celtics/news/pressrelease/celtics-sign-justin-jackson)                                      |
| `kareem`             | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `ken-norman`         | `bucks-n-six`  | professional | [Source](https://www.nba.com/gamenotes/bucks.pdf)                                                                        |
| `let-khris-cook`     | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `mayberry`           | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `malcolm-brogdon`    | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `marjon`             | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks)                                              |
| `marques-johnson`    | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `marty-conlon`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `redd`               | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `moses-malone`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/mb-130415)                                                                   |
| `big-o`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `pops-junior`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `project-pat`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `pau-gasol`          | `bucks-n-six`  | professional | [Source](https://cdn-uat.nba.com/news/trail-blazers-waive-pau-gasol)                                                     |
| `jesus`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `ricky-pierce`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `alien`              | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `sam`                | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `shawn-respert`      | `bucks-n-six`  | professional | [Source](https://www.nba.com/player/704/shawn-respert)                                                                   |
| `sherminator`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `sidney-moncrief`    | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `sterling-brown`     | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `t-j-ford`           | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-starters)                                                             |
| `t-brandon`          | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `thanasty`           | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks)                                                   |
| `thon-maker`         | `bucks-n-six`  | professional | [Source](https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf)                                                |
| `tim-thomas`         | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-starters)                                                             |
| `tiny-archibald`     | `bucks-n-six`  | professional | [Source](https://www.nba.com/team/1610612749/bucks/roster)                                                               |
| `tobias`             | `bucks-n-six`  | professional | [Source](https://www.nba.com/news/trade-deadline-deals-all-time-history)                                                 |
| `day`                | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player)                              |
| `toni`               | `bucks-n-six`  | professional | [Source](https://www.nba.com/team/1610612749/bucks/roster)                                                               |
| `tractor-traylor`    | `bucks-n-six`  | professional | [Source](https://www.nba.com/game/mil-vs-bos-0029800446/box-score)                                                       |
| `tyrone-hill`        | `bucks-n-six`  | professional | [Source](https://www.nba.com/news/trade-deadline-deals-all-time-history)                                                 |
| `vin`                | `bucks-n-six`  | professional | [Source](https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters)                                      |
| `wes-matthews`       | `bucks-n-six`  | professional | [Source](https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks)                                              |
| `joe-pavelski`       | `bucky`        | college      | [Source](https://uwbadgers.com/news/2006/7/14/Pavelski_Signs_With_San_Jose_Sharks)                                       |
| `fin-dawg`           | `bucky`        | college      | [Source](https://uwbadgers.com/sports/2015/08/21/GEN_20140101817)                                                        |
| `jagr`               | `capitals`     | professional | [Source](https://www.nhl.com/capitals/history/all-time-roster)                                                           |
| `t-brandon`          | `ducks`        | college      | [Source](https://goducks.com/honors/hall-of-fame/terrell-brandon/43)                                                     |
| `james-lofton`       | `eagles`       | professional | [Source](https://www.philadelphiaeagles.com/team/stats/1993/)                                                            |
| `reggie-white`       | `eagles`       | professional | [Source](https://www.packers.com/news/packers-to-retire-reggie-white-s-number-sept-18-2459413)                           |
| `zo`                 | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `penny`              | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `anthony-mason`      | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `bam`                | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `blue`               | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2022/11/2022-23-Miami-Heat-Media-Guide.pdf)                  |
| `chris-bosh`         | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `flash`              | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `murdock`            | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `the-glove`          | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `freak`              | `heat-culture` | professional | [Source](https://www.nba.com/player/203507/giannis-antetokounmpo)                                                        |
| `playoff-jimmy`      | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `juwan-howard`       | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `lebron-james`       | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `marty-conlon`       | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `pops-junior`        | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `jesus`              | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `diesel`             | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `sherminator`        | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `tim-hardaway`       | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `day`                | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `tyrone-hill`        | `heat-culture` | professional | [Source](https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf)         |
| `aaron-jones`        | `lombardi`     | professional | [Source](https://www.packers.com/news/packers-release-rb-aaron-jones)                                                    |
| `aaron-rodgers`      | `lombardi`     | professional | [Source](https://www.packers.com/news/who-are-the-packers-greatest-offensive-players-since-1950)                         |
| `brett-favre`        | `lombardi`     | professional | [Source](https://www.packers.com/news/who-are-the-packers-greatest-offensive-players-since-1950)                         |
| `charles-woodson`    | `lombardi`     | professional | [Source](https://www.packers.com/history/hof/charles-woodson)                                                            |
| `chuck-cecil`        | `lombardi`     | professional | [Source](https://www.packers.com/news/notebook-raji-working-both-nose-end-positions-2404794)                             |
| `davante-adams`      | `lombardi`     | professional | [Source](https://www.raiders.com/history/all-time-roster/bios-a/davante-adams)                                           |
| `desmond-howard`     | `lombardi`     | professional | [Source](https://www.nfl.com/players/desmond-howard/stats/career)                                                        |
| `edgar-bennett`      | `lombardi`     | professional | [Source](https://www.packers.com/history/hof/edgar-bennett)                                                              |
| `james-lofton`       | `lombardi`     | professional | [Source](https://www.packers.com/history/hof/james-lofton)                                                               |
| `leroy-butler`       | `lombardi`     | professional | [Source](https://www.packers.com/history/hof/leroy-butler)                                                               |
| `reggie-white`       | `lombardi`     | professional | [Source](https://www.packers.com/news/packers-to-retire-reggie-white-s-number-sept-18-2459413)                           |
| `sterling`           | `lombardi`     | professional | [Source](https://www.packers.com/history/hof/sterling-sharpe)                                                            |
| `terrell-buckley`    | `lombardi`     | professional | [Source](https://www.patriots.com/news/patriots-sign-veteran-free-agent-cb-terrell-buckley-and-three-2001-draft--149471) |
| `bob-sura`           | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/25/Record-Book-With-covers.pdf)                                 |
| `buster-posey`       | `noles`        | college      | [Source](https://seminoles.com/honors/florida-state-athletics-hall-of-fame/buster-posey/273)                             |
| `charlie-ward`       | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/25/Record-Book-With-covers.pdf)                                 |
| `primetime`          | `noles`        | college      | [Source](https://seminoles.com/honors/florida-state-athletics-hall-of-fame/deion-sanders/99)                             |
| `derrick-brooks`     | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf)                                             |
| `devin`              | `noles`        | college      | [Source](https://seminoles.com/sports/mens-basketball/roster/devin-vassell/4463)                                         |
| `edgar-bennett`      | `noles`        | college      | [Source](https://www.packers.com/history/hof/edgar-bennett)                                                              |
| `leroy-butler`       | `noles`        | college      | [Source](https://www.packers.com/history/hof/leroy-butler)                                                               |
| `patrick-williams`   | `noles`        | college      | [Source](https://seminoles.com/sports/mens-basketball/roster/patrick-williams/4422)                                      |
| `warrick`            | `noles`        | college      | [Source](https://seminoles.com/news/2026/1/14/peter-warrick-named-to-college-football-hall-of-fame)                      |
| `alien`              | `noles`        | college      | [Source](https://seminoles.com/honors/florida-state-athletics-hall-of-fame/sam-cassell/254)                              |
| `barnes`             | `noles`        | college      | [Source](https://seminoles.com/sports/mens-basketball/roster/scottie-barnes/3673)                                        |
| `tamarick-vanover`   | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf)                                             |
| `terrell-buckley`    | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf)                                             |
| `warrick-dunn`       | `noles`        | college      | [Source](https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf)                                             |
| `primetime`          | `redskins`     | professional | [Source](https://www.commanders.com/news/sanders-return-to-fedexfield-3458909)                                           |
| `desmond-howard`     | `redskins`     | professional | [Source](https://www.commanders.com/team/history/all-time-roster)                                                        |
| `aaron-holiday`      | `rockets`      | professional | [Source](https://www.nba.com/rockets/news/rockets-re-sign-aaron-holiday)                                                 |
| `bob-sura`           | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `carmelo-anthony`    | `rockets`      | professional | [Source](https://www.nba.com/news/bulls-complete-trade-rockets-carmelo-anthony)                                          |
| `sir-charles`        | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `charlie-ward`       | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `cp3`                | `rockets`      | professional | [Source](https://www.nba.com/rockets/rockets-vs-warriors)                                                                |
| `clyde-drexler`      | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `dj`                 | `rockets`      | professional | [Source](https://www.nba.com/player/1628391/dj-wilson)                                                                   |
| `dikembe-mutombo`    | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `the-dream`          | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `beard`              | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `jason-terry`        | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `jon-mcglocklin`     | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `juwan-howard`       | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `kd`                 | `rockets`      | professional | [Source](https://www.nba.com/team/1610612745/rockets/roster)                                                             |
| `moses-malone`       | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `pops-junior`        | `rockets`      | professional | [Source](https://www.nba.com/news/all-defensive-teams-official-release-2017-18-season)                                   |
| `alien`              | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `scottie-pippen`     | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `sterling-brown`     | `rockets`      | professional | [Source](https://www.nba.com/news/nba-offseason-2021-august-2-roundup)                                                   |
| `t-mac`              | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `vin`                | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `yo`                 | `rockets`      | professional | [Source](https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf)               |
| `aaron-holiday`      | `suns`         | professional | [Source](https://www.nba.com/gamenotes/rockets.pdf?page=5)                                                               |
| `andrew-lang`        | `suns`         | professional | [Source](https://www.nba.com/stats/player/457/traditional)                                                               |
| `penny`              | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `armen-gilliam`      | `suns`         | professional | [Source](https://www.nba.com/player/288/armen-gilliam)                                                                   |
| `sir-charles`        | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `cp3`                | `suns`         | professional | [Source](https://www.nba.com/player/101108/chris-paul)                                                                   |
| `danny`              | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `bledsoe`            | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `drinks-sprite`      | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `grayson`            | `suns`         | professional | [Source](https://www.nba.com/game/0022300113)                                                                            |
| `jalen-rose`         | `suns`         | professional | [Source](https://www.nba.com/player/147/jalen_rose)                                                                      |
| `j-kidd`             | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `justin-jackson`     | `suns`         | professional | [Source](https://texas.gleague.nba.com/news/justin-jackson-signs-with-phoenix-suns)                                      |
| `kd`                 | `suns`         | professional | [Source](https://www.nba.com/game/0022300113)                                                                            |
| `fin-dawg`           | `suns`         | professional | [Source](https://www.nba.com/player/714/michael-finley)                                                                  |
| `redd`               | `suns`         | professional | [Source](https://www.nba.com/suns/news/newsroom_120204.html)                                                             |
| `pops-junior`        | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `alien`              | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `diesel`             | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `shawn-respert`      | `suns`         | professional | [Source](https://www.nba.com/player/704/shawn-respert)                                                                   |
| `nash`               | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `tim-thomas`         | `suns`         | professional | [Source](https://www.nba.com/suns/history/suns-throwback-part-time-player-big-time-shot)                                 |
| `day`                | `suns`         | professional | [Source](https://www.nba.com/suns/news/one-one-matrix)                                                                   |
| `vince-carter`       | `suns`         | professional | [Source](https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf)                                            |
| `andrew-lang`        | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `ant-man`            | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `bryn-forbes`        | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `white-donte`        | `t-wolves`     | professional | [Source](https://www.nba.com/team/1610612750/timberwolves/roster)                                                        |
| `ervin-johnson`      | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `jeff`               | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `playoff-jimmy`      | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `ingles`             | `t-wolves`     | professional | [Source](https://www.nba.com/stats/player/204060/)                                                                       |
| `joe-smith`          | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `justin-jackson`     | `t-wolves`     | professional | [Source](https://www.nba.com/player/1628382/justin-jackson)                                                              |
| `karl-anthony-towns` | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `the-big-ticket`     | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `lamelo`             | `t-wolves`     | professional | [Source](https://www.nba.com/team/1610612750/timberwolves/roster)                                                        |
| `alien`              | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `t-brandon`          | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
| `day`                | `t-wolves`     | professional | [Source](https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf)                    |
