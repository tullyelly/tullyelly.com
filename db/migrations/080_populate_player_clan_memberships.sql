-- 080_populate_player_clan_memberships.sql
-- Reviewed against production on 2026-10-24; manual execution only.
-- Requires migrations 070, 073, 074 and 079. All IDs resolve from stable keys.
-- Career/college affiliations are intentional; this is not a current-roster feed.
-- After a failed attempt, issue ROLLBACK in that session before rerunning this file.
SET search_path = dojo, auth, public;

BEGIN;

-- Keep endpoint validation and insertion on a stable identity set.
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE ROW EXCLUSIVE MODE;

-- These production-reviewed teams may be absent in an older development copy.
CREATE TEMP TABLE player_clan_reference_seed (
  clan_name TEXT NOT NULL,
  clan_slug TEXT PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO player_clan_reference_seed (clan_name, clan_slug) VALUES
  ('Portland Trail Blazers', 'blazers'),
  ('Phoenix Suns', 'suns');

CREATE TEMP TABLE player_tag_seed (
  homie_name TEXT PRIMARY KEY,
  tag_slug TEXT NOT NULL UNIQUE
) ON COMMIT DROP;

-- Full-name slugs for unambiguous, currently untagged named homies, plus the
-- reviewed Dell Curry/Tobias Harris aliases missing in older development copies.
-- Duplicate Peter Warrick/Tiger Woods and literal backfill rows are excluded.
INSERT INTO player_tag_seed (homie_name, tag_slug) VALUES
  ('Aaron Holiday', 'aaron-holiday'),
  ('Aaron Jones', 'aaron-jones'),
  ('Aaron Rodgers', 'aaron-rodgers'),
  ('Allen Iverson', 'allen-iverson'),
  ('Alvin Robertson', 'alvin-robertson'),
  ('Andrew Bogut', 'andrew-bogut'),
  ('Andrew Lang', 'andrew-lang'),
  ('Anthony Mason', 'anthony-mason'),
  ('Armen Gilliam', 'armen-gilliam'),
  ('Bo Jackson', 'bo-jackson'),
  ('Bob Dandridge', 'bob-dandridge'),
  ('Bob Sura', 'bob-sura'),
  ('Brett Favre', 'brett-favre'),
  ('Bryn Forbes', 'bryn-forbes'),
  ('Buster Posey', 'buster-posey'),
  ('Cal Ripken Jr.', 'cal-ripken-jr'),
  ('Cale Makar', 'cale-makar'),
  ('Calvin Johnson', 'calvin-johnson'),
  ('Carmelo Anthony', 'carmelo-anthony'),
  ('Charles Woodson', 'charles-woodson'),
  ('Charlie Ward', 'charlie-ward'),
  ('Chris Bosh', 'chris-bosh'),
  ('Chris Mullin', 'chris-mullin'),
  ('Chuck Cecil', 'chuck-cecil'),
  ('Clyde Drexler', 'clyde-drexler'),
  ('Connor McDavid', 'connor-mcdavid'),
  ('Dale Ellis', 'dale-ellis'),
  ('Daniel Ricciardo', 'daniel-ricciardo'),
  ('Davante Adams', 'davante-adams'),
  ('Dell Curry', 'dell'),
  ('Dennis Rodman', 'dennis-rodman'),
  ('Derrick Brooks', 'derrick-brooks'),
  ('Desmond Howard', 'desmond-howard'),
  ('Desmond Mason', 'desmond-mason'),
  ('Dikembe Mutombo', 'dikembe-mutombo'),
  ('Dirk Nowitzki', 'dirk-nowitzki'),
  ('Dominique Wilkins', 'dominique-wilkins'),
  ('Draymond Green', 'draymond-green'),
  ('Dāvis Bertāns', 'davis-bertans'),
  ('Edgar Bennett', 'edgar-bennett'),
  ('Edgerrin James', 'edgerrin-james'),
  ('Eric Davis', 'eric-davis'),
  ('Ervin Johnson', 'ervin-johnson'),
  ('Fat Lever', 'fat-lever'),
  ('Greg Maddux', 'greg-maddux'),
  ('Isiah Thomas', 'isiah-thomas'),
  ('Ja Morant', 'ja-morant'),
  ('Jack Sikma', 'jack-sikma'),
  ('Jalen Rose', 'jalen-rose'),
  ('James Lofton', 'james-lofton'),
  ('Jason Terry', 'jason-terry'),
  ('Joe Dumars', 'joe-dumars'),
  ('Joe Montana', 'joe-montana'),
  ('Joe Pavelski', 'joe-pavelski'),
  ('Joe Sakic', 'joe-sakic'),
  ('John Henson', 'john-henson'),
  ('John Stockton', 'john-stockton'),
  ('Johnny Newman', 'johnny-newman'),
  ('Jon McGlocklin', 'jon-mcglocklin'),
  ('Julius Erving', 'julius-erving'),
  ('Justin Jackson', 'justin-jackson'),
  ('Juwan Howard', 'juwan-howard'),
  ('Karl Malone', 'karl-malone'),
  ('Karl-Anthony Towns', 'karl-anthony-towns'),
  ('Ken Griffey Jr.', 'ken-griffey-jr'),
  ('Ken Norman', 'ken-norman'),
  ('Klay Thompson', 'klay-thompson'),
  ('Kostas Antetokounmpo', 'kostas-antetokounmpo'),
  ('Larry Bird', 'larry-bird'),
  ('Lawrence Taylor', 'lawrence-taylor'),
  ('Lebron James', 'lebron-james'),
  ('Leon Draisaitl', 'leon-draisaitl'),
  ('Leroy Butler', 'leroy-butler'),
  ('Malcolm Brogdon', 'malcolm-brogdon'),
  ('Mario Lemieux', 'mario-lemieux'),
  ('Marques Johnson', 'marques-johnson'),
  ('Marty Conlon', 'marty-conlon'),
  ('Mitch Richmond', 'mitch-richmond'),
  ('Moses Malone', 'moses-malone'),
  ('Nathan McKinnon', 'nathan-mckinnon'),
  ('Nolan Ryan', 'nolan-ryan'),
  ('Patrick Williams', 'patrick-williams'),
  ('Pau Gasol', 'pau-gasol'),
  ('Paul Molitor', 'paul-molitor'),
  ('Peyton Manning', 'peyton-manning'),
  ('Raekwon Davis', 'raekwon-davis'),
  ('Reggie Bush', 'reggie-bush'),
  ('Reggie Miller', 'reggie-miller'),
  ('Reggie White', 'reggie-white'),
  ('Rickie Weeks', 'rickie-weeks'),
  ('Ricky Pierce', 'ricky-pierce'),
  ('Robert Parish', 'robert-parish'),
  ('Robin Yount', 'robin-yount'),
  ('Ryan Braun', 'ryan-braun'),
  ('Scottie Pippen', 'scottie-pippen'),
  ('Shai Gilgeous-Alexander', 'shai-gilgeous-alexander'),
  ('Shawn Respert', 'shawn-respert'),
  ('Sidney Crosby', 'sidney-crosby'),
  ('Sidney Moncrief', 'sidney-moncrief'),
  ('Spike Owen', 'spike-owen'),
  ('Sterling Brown', 'sterling-brown'),
  ('T.J. Ford', 't-j-ford'),
  ('Tamarick Vanover', 'tamarick-vanover'),
  ('Terrell Buckley', 'terrell-buckley'),
  ('Thon Maker', 'thon-maker'),
  ('Tim Hardaway', 'tim-hardaway'),
  ('Tiny Archibald', 'tiny-archibald'),
  ('Tobias Harris', 'tobias'),
  ('Tractor Traylor', 'tractor-traylor'),
  ('Tyrone Hill', 'tyrone-hill'),
  ('Victor Wembanyama', 'victor-wembanyama'),
  ('Vince Carter', 'vince-carter'),
  ('Warrick Dunn', 'warrick-dunn'),
  ('Wayne Gretsky', 'wayne-gretsky'),
  ('Wes Matthews', 'wes-matthews');

CREATE TEMP TABLE player_clan_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  affiliation_scope TEXT NOT NULL CHECK (affiliation_scope IN ('college', 'professional')),
  evidence_url TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

-- Positive played-for matches only, each with primary team/league/university evidence.
-- Existing valid member_of edges remain unchanged through ON CONFLICT below.
INSERT INTO player_clan_seed
  (homie_name, source_slug, clan_slug, affiliation_scope, evidence_url) VALUES
  ('Nolan Ryan', 'nolan-ryan', 'astros', 'professional', 'https://www.mlb.com/astros/history/hall-of-fame/inductees'),
  ('Carmelo Anthony', 'carmelo-anthony', 'blazers', 'professional', 'https://www.nba.com/team/1610612757/blazers/roster'),
  ('Clyde Drexler', 'clyde-drexler', 'blazers', 'professional', 'https://www.nba.com/team/1610612757/blazers/roster'),
  ('Dame Lillard', 'dame-time', 'blazers', 'professional', 'https://www.nba.com/news/bucks-waive-damian-lillard'),
  ('Fat Lever', 'fat-lever', 'blazers', 'professional', 'https://www.nba.com/news/denver-nuggets-all-time-steals-leaders'),
  ('Ja Morant', 'ja-morant', 'blazers', 'professional', 'https://www.nba.com/gamenotes/blazers.pdf'),
  ('Jrue Holiday', 'jrue', 'blazers', 'professional', 'https://www.nba.com/player/201950/jrue-holiday'),
  ('Juwan Howard', 'juwan-howard', 'blazers', 'professional', 'https://www.nba.com/game/den-vs-por-0020900018/box-score'),
  ('Malcolm Brogdon', 'malcolm-brogdon', 'blazers', 'professional', 'https://statsdmz.nba.com/pdfs/20240105/20240105_PORDAL_book.pdf'),
  ('Pat Connaughton', 'project-pat', 'blazers', 'professional', 'https://www.nba.com/blazers/news/trail-blazers-look-end-two-year-losing-streak-bucks-tuesday-night'),
  ('Scottie Pippen', 'scottie-pippen', 'blazers', 'professional', 'https://www.nba.com/team/1610612757/blazers/roster'),
  ('Shawn Kemp', 'reign-man', 'blazers', 'professional', 'https://cdn-uat.nba.com/news/all-time-starting-5-indiana-raised-players'),
  ('Wes Matthews', 'wes-matthews', 'blazers', 'professional', 'https://www.nba.com/blazers/news/player-profile-wesley-matthews'),
  ('Paul Molitor', 'paul-molitor', 'brew-crew', 'professional', 'https://baseballhall.org/hall-of-famers/molitor-paul'),
  ('Prince Fielder', 'prince', 'brew-crew', 'professional', 'https://www.mlb.com/player/prince-fielder-425902'),
  ('Rickie Weeks', 'rickie-weeks', 'brew-crew', 'professional', 'https://www.mlb.com/news/mariners-sign-rickie-weeks-to-major-league-contract/c-109225802'),
  ('Robin Yount', 'robin-yount', 'brew-crew', 'professional', 'https://baseballhall.org/hall-of-famers/yount-robin'),
  ('Ryan Braun', 'ryan-braun', 'brew-crew', 'professional', 'https://www.mlb.com/brewers/press-release/press-release-ryan-braun-announces-retirement'),
  ('AJ Green', 'dairy-bird', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20260319/20260319_MILUTA_book.pdf'),
  ('Alvin Robertson', 'alvin-robertson', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Andre Jackson Jr.', 'ajax', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20260319/20260319_MILUTA_book.pdf'),
  ('Andrew Bogut', 'andrew-bogut', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Andrew Lang', 'andrew-lang', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Anthony Mason', 'anthony-mason', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-starters'),
  ('Armen Gilliam', 'armen-gilliam', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Blue Edwards', 'blue', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Bob Dandridge', 'bob-dandridge', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Bobby Portis', 'bobby', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Brandon Jennings', 'bucks-in-six', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/news/bucks-sign-brandon-jennings-10-day-contract'),
  ('Brook Lopez', 'splash-mountain', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Bryn Forbes', 'bryn-forbes', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('D.J. Wilson', 'dj', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('Dale Ellis', 'dale-ellis', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-130125'),
  ('Dame Lillard', 'dame-time', 'bucks-n-six', 'professional', 'https://www.nba.com/news/bucks-waive-damian-lillard'),
  ('Danny Manning', 'danny', 'bucks-n-six', 'professional', 'https://www.nba.com/news/nba-birthdays-players-born-on-may-17'),
  ('Dell Curry', 'dell', 'bucks-n-six', 'professional', 'https://jr.nba.com/so-who-is-stephen-currys-dad/'),
  ('Desmond Mason', 'desmond-mason', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-starters'),
  ('Donte DiVincenzo', 'white-donte', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Eric Bledsoe', 'bledsoe', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('Eric Murdock', 'murdock', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Ersan İlyasova', 'charge', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181209/20181209_MILTOR.pdf'),
  ('Ervin Johnson', 'ervin-johnson', 'bucks-n-six', 'professional', 'https://www.nba.com/player/911'),
  ('Gary Payton', 'the-glove', 'bucks-n-six', 'professional', 'https://www.nba.com/news/trade-deadline-deals-all-time-history'),
  ('George Hill', 'blm', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('Giannis Antetokounmpo', 'freak', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Glenn Robinson', 'big-dog', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Grayson Allen', 'grayson', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks'),
  ('Jabari Parker', 'jabari', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Jack Sikma', 'jack-sikma', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/mb-130415'),
  ('Jason Terry', 'jason-terry', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/release/bucks-re-sign-jason-terry'),
  ('Jeff Teague', 'jeff', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Joe Ingles', 'ingles', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks'),
  ('Joe Smith', 'joe-smith', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-starters'),
  ('John Henson', 'john-henson', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-130420'),
  ('Johnny Newman', 'johnny-newman', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Jon McGlocklin', 'jon-mcglocklin', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Jordan Nwora', 'nwora', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Jrue Holiday', 'jrue', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Justin Jackson', 'justin-jackson', 'bucks-n-six', 'professional', 'https://www.nba.com/celtics/news/pressrelease/celtics-sign-justin-jackson'),
  ('Kareem Abdul-Jabbar', 'kareem', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Ken Norman', 'ken-norman', 'bucks-n-six', 'professional', 'https://www.nba.com/gamenotes/bucks.pdf'),
  ('Khris Middleton', 'let-khris-cook', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Lee Mayberry', 'mayberry', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Malcolm Brogdon', 'malcolm-brogdon', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('Marjon Beauchamp', 'marjon', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks'),
  ('Marques Johnson', 'marques-johnson', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Marty Conlon', 'marty-conlon', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Michael Redd', 'redd', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Moses Malone', 'moses-malone', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/mb-130415'),
  ('Oscar Robertson', 'big-o', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('P.J. Tucker', 'pops-junior', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Pat Connaughton', 'project-pat', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Pau Gasol', 'pau-gasol', 'bucks-n-six', 'professional', 'https://cdn-uat.nba.com/news/trail-blazers-waive-pau-gasol'),
  ('Ray Allen', 'jesus', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Ricky Pierce', 'ricky-pierce', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Sam Cassell', 'alien', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Sam Merrill', 'sam', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Shawn Respert', 'shawn-respert', 'bucks-n-six', 'professional', 'https://www.nba.com/player/704/shawn-respert'),
  ('Sherman Douglas', 'sherminator', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Sidney Moncrief', 'sidney-moncrief', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Sterling Brown', 'sterling-brown', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('T.J. Ford', 't-j-ford', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-starters'),
  ('Terrell Brandon', 't-brandon', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Thanasis Antetokounmpo', 'thanasty', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2021/team-profiles/milwaukee-bucks'),
  ('Thon Maker', 'thon-maker', 'bucks-n-six', 'professional', 'https://statsdmz.nba.com/pdfs/20181225/20181225_MILNYK_Book.pdf'),
  ('Tim Thomas', 'tim-thomas', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-starters'),
  ('Tiny Archibald', 'tiny-archibald', 'bucks-n-six', 'professional', 'https://www.nba.com/team/1610612749/bucks/roster'),
  ('Tobias Harris', 'tobias', 'bucks-n-six', 'professional', 'https://www.nba.com/news/trade-deadline-deals-all-time-history'),
  ('Todd Day', 'day', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player'),
  ('Toni Kukoč', 'toni', 'bucks-n-six', 'professional', 'https://www.nba.com/team/1610612749/bucks/roster'),
  ('Tractor Traylor', 'tractor-traylor', 'bucks-n-six', 'professional', 'https://www.nba.com/game/mil-vs-bos-0029800446/box-score'),
  ('Tyrone Hill', 'tyrone-hill', 'bucks-n-six', 'professional', 'https://www.nba.com/news/trade-deadline-deals-all-time-history'),
  ('Vin Baker', 'vin', 'bucks-n-six', 'professional', 'https://www.nba.com/bucks/features/boeder-bucks-all-time-all-star-rosters'),
  ('Wes Matthews', 'wes-matthews', 'bucks-n-six', 'professional', 'https://www.nba.com/draft/2023/team-profiles/2023-milwaukee-bucks'),
  ('Joe Pavelski', 'joe-pavelski', 'bucky', 'college', 'https://uwbadgers.com/news/2006/7/14/Pavelski_Signs_With_San_Jose_Sharks'),
  ('Michael Finley', 'fin-dawg', 'bucky', 'college', 'https://uwbadgers.com/sports/2015/08/21/GEN_20140101817'),
  ('Jaromir Jagr', 'jagr', 'capitals', 'professional', 'https://www.nhl.com/capitals/history/all-time-roster'),
  ('Terrell Brandon', 't-brandon', 'ducks', 'college', 'https://goducks.com/honors/hall-of-fame/terrell-brandon/43'),
  ('James Lofton', 'james-lofton', 'eagles', 'professional', 'https://www.philadelphiaeagles.com/team/stats/1993/'),
  ('Reggie White', 'reggie-white', 'eagles', 'professional', 'https://www.packers.com/news/packers-to-retire-reggie-white-s-number-sept-18-2459413'),
  ('Alonzo Mourning', 'zo', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Anfernee Hardaway', 'penny', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Anthony Mason', 'anthony-mason', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Bam Adebayo', 'bam', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Blue Edwards', 'blue', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2022/11/2022-23-Miami-Heat-Media-Guide.pdf'),
  ('Chris Bosh', 'chris-bosh', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Dwyane Wade', 'flash', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Eric Murdock', 'murdock', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Gary Payton', 'the-glove', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Giannis Antetokounmpo', 'freak', 'heat-culture', 'professional', 'https://www.nba.com/player/203507/giannis-antetokounmpo'),
  ('Jimmy Butler', 'playoff-jimmy', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Juwan Howard', 'juwan-howard', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Lebron James', 'lebron-james', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Marty Conlon', 'marty-conlon', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('P.J. Tucker', 'pops-junior', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Ray Allen', 'jesus', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Shaquille O''Neal', 'diesel', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Sherman Douglas', 'sherminator', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Tim Hardaway', 'tim-hardaway', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Todd Day', 'day', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Tyrone Hill', 'tyrone-hill', 'heat-culture', 'professional', 'https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf'),
  ('Aaron Jones', 'aaron-jones', 'lombardi', 'professional', 'https://www.packers.com/news/packers-release-rb-aaron-jones'),
  ('Aaron Rodgers', 'aaron-rodgers', 'lombardi', 'professional', 'https://www.packers.com/news/who-are-the-packers-greatest-offensive-players-since-1950'),
  ('Brett Favre', 'brett-favre', 'lombardi', 'professional', 'https://www.packers.com/news/who-are-the-packers-greatest-offensive-players-since-1950'),
  ('Charles Woodson', 'charles-woodson', 'lombardi', 'professional', 'https://www.packers.com/history/hof/charles-woodson'),
  ('Chuck Cecil', 'chuck-cecil', 'lombardi', 'professional', 'https://www.packers.com/news/notebook-raji-working-both-nose-end-positions-2404794'),
  ('Davante Adams', 'davante-adams', 'lombardi', 'professional', 'https://www.raiders.com/history/all-time-roster/bios-a/davante-adams'),
  ('Desmond Howard', 'desmond-howard', 'lombardi', 'professional', 'https://www.nfl.com/players/desmond-howard/stats/career'),
  ('Edgar Bennett', 'edgar-bennett', 'lombardi', 'professional', 'https://www.packers.com/history/hof/edgar-bennett'),
  ('James Lofton', 'james-lofton', 'lombardi', 'professional', 'https://www.packers.com/history/hof/james-lofton'),
  ('Leroy Butler', 'leroy-butler', 'lombardi', 'professional', 'https://www.packers.com/history/hof/leroy-butler'),
  ('Reggie White', 'reggie-white', 'lombardi', 'professional', 'https://www.packers.com/news/packers-to-retire-reggie-white-s-number-sept-18-2459413'),
  ('Sterling Sharpe', 'sterling', 'lombardi', 'professional', 'https://www.packers.com/history/hof/sterling-sharpe'),
  ('Terrell Buckley', 'terrell-buckley', 'lombardi', 'professional', 'https://www.patriots.com/news/patriots-sign-veteran-free-agent-cb-terrell-buckley-and-three-2001-draft--149471'),
  ('Bob Sura', 'bob-sura', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/25/Record-Book-With-covers.pdf'),
  ('Buster Posey', 'buster-posey', 'noles', 'college', 'https://seminoles.com/honors/florida-state-athletics-hall-of-fame/buster-posey/273'),
  ('Charlie Ward', 'charlie-ward', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/25/Record-Book-With-covers.pdf'),
  ('Deion Sanders', 'primetime', 'noles', 'college', 'https://seminoles.com/honors/florida-state-athletics-hall-of-fame/deion-sanders/99'),
  ('Derrick Brooks', 'derrick-brooks', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf'),
  ('Devin Vassell', 'devin', 'noles', 'college', 'https://seminoles.com/sports/mens-basketball/roster/devin-vassell/4463'),
  ('Edgar Bennett', 'edgar-bennett', 'noles', 'college', 'https://www.packers.com/history/hof/edgar-bennett'),
  ('Leroy Butler', 'leroy-butler', 'noles', 'college', 'https://www.packers.com/history/hof/leroy-butler'),
  ('Patrick Williams', 'patrick-williams', 'noles', 'college', 'https://seminoles.com/sports/mens-basketball/roster/patrick-williams/4422'),
  ('Peter Warrick', 'warrick', 'noles', 'college', 'https://seminoles.com/news/2026/1/14/peter-warrick-named-to-college-football-hall-of-fame'),
  ('Sam Cassell', 'alien', 'noles', 'college', 'https://seminoles.com/honors/florida-state-athletics-hall-of-fame/sam-cassell/254'),
  ('Scottie Barnes', 'barnes', 'noles', 'college', 'https://seminoles.com/sports/mens-basketball/roster/scottie-barnes/3673'),
  ('Tamarick Vanover', 'tamarick-vanover', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf'),
  ('Terrell Buckley', 'terrell-buckley', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf'),
  ('Warrick Dunn', 'warrick-dunn', 'noles', 'college', 'https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf'),
  ('Deion Sanders', 'primetime', 'redskins', 'professional', 'https://www.commanders.com/news/sanders-return-to-fedexfield-3458909'),
  ('Desmond Howard', 'desmond-howard', 'redskins', 'professional', 'https://www.commanders.com/team/history/all-time-roster'),
  ('Aaron Holiday', 'aaron-holiday', 'rockets', 'professional', 'https://www.nba.com/rockets/news/rockets-re-sign-aaron-holiday'),
  ('Bob Sura', 'bob-sura', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Carmelo Anthony', 'carmelo-anthony', 'rockets', 'professional', 'https://www.nba.com/news/bulls-complete-trade-rockets-carmelo-anthony'),
  ('Charles Barkley', 'sir-charles', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Charlie Ward', 'charlie-ward', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Chris Paul', 'cp3', 'rockets', 'professional', 'https://www.nba.com/rockets/rockets-vs-warriors'),
  ('Clyde Drexler', 'clyde-drexler', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('D.J. Wilson', 'dj', 'rockets', 'professional', 'https://www.nba.com/player/1628391/dj-wilson'),
  ('Dikembe Mutombo', 'dikembe-mutombo', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Hakeem Olajuwon', 'the-dream', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('James Harden', 'beard', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Jason Terry', 'jason-terry', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Jon McGlocklin', 'jon-mcglocklin', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Juwan Howard', 'juwan-howard', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Kevin Durant', 'kd', 'rockets', 'professional', 'https://www.nba.com/team/1610612745/rockets/roster'),
  ('Moses Malone', 'moses-malone', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('P.J. Tucker', 'pops-junior', 'rockets', 'professional', 'https://www.nba.com/news/all-defensive-teams-official-release-2017-18-season'),
  ('Sam Cassell', 'alien', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Scottie Pippen', 'scottie-pippen', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Sterling Brown', 'sterling-brown', 'rockets', 'professional', 'https://www.nba.com/news/nba-offseason-2021-august-2-roundup'),
  ('Tracy McGrady', 't-mac', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Vin Baker', 'vin', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Yao Ming', 'yo', 'rockets', 'professional', 'https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf'),
  ('Aaron Holiday', 'aaron-holiday', 'suns', 'professional', 'https://www.nba.com/gamenotes/rockets.pdf?page=5'),
  ('Andrew Lang', 'andrew-lang', 'suns', 'professional', 'https://www.nba.com/stats/player/457/traditional'),
  ('Anfernee Hardaway', 'penny', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Armen Gilliam', 'armen-gilliam', 'suns', 'professional', 'https://www.nba.com/player/288/armen-gilliam'),
  ('Charles Barkley', 'sir-charles', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Chris Paul', 'cp3', 'suns', 'professional', 'https://www.nba.com/player/101108/chris-paul'),
  ('Danny Manning', 'danny', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Eric Bledsoe', 'bledsoe', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Grant Hill', 'drinks-sprite', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Grayson Allen', 'grayson', 'suns', 'professional', 'https://www.nba.com/game/0022300113'),
  ('Jalen Rose', 'jalen-rose', 'suns', 'professional', 'https://www.nba.com/player/147/jalen_rose'),
  ('Jason Kidd', 'j-kidd', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Justin Jackson', 'justin-jackson', 'suns', 'professional', 'https://texas.gleague.nba.com/news/justin-jackson-signs-with-phoenix-suns'),
  ('Kevin Durant', 'kd', 'suns', 'professional', 'https://www.nba.com/game/0022300113'),
  ('Michael Finley', 'fin-dawg', 'suns', 'professional', 'https://www.nba.com/player/714/michael-finley'),
  ('Michael Redd', 'redd', 'suns', 'professional', 'https://www.nba.com/suns/news/newsroom_120204.html'),
  ('P.J. Tucker', 'pops-junior', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Sam Cassell', 'alien', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Shaquille O''Neal', 'diesel', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Shawn Respert', 'shawn-respert', 'suns', 'professional', 'https://www.nba.com/player/704/shawn-respert'),
  ('Steve Nash', 'nash', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Tim Thomas', 'tim-thomas', 'suns', 'professional', 'https://www.nba.com/suns/history/suns-throwback-part-time-player-big-time-shot'),
  ('Todd Day', 'day', 'suns', 'professional', 'https://www.nba.com/suns/news/one-one-matrix'),
  ('Vince Carter', 'vince-carter', 'suns', 'professional', 'https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf'),
  ('Andrew Lang', 'andrew-lang', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Anthony Edwards', 'ant-man', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Bryn Forbes', 'bryn-forbes', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Donte DiVincenzo', 'white-donte', 't-wolves', 'professional', 'https://www.nba.com/team/1610612750/timberwolves/roster'),
  ('Ervin Johnson', 'ervin-johnson', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Jeff Teague', 'jeff', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Jimmy Butler', 'playoff-jimmy', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Joe Ingles', 'ingles', 't-wolves', 'professional', 'https://www.nba.com/stats/player/204060/'),
  ('Joe Smith', 'joe-smith', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Justin Jackson', 'justin-jackson', 't-wolves', 'professional', 'https://www.nba.com/player/1628382/justin-jackson'),
  ('Karl-Anthony Towns', 'karl-anthony-towns', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Kevin Garnett', 'the-big-ticket', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('LaMelo Ball', 'lamelo', 't-wolves', 'professional', 'https://www.nba.com/team/1610612750/timberwolves/roster'),
  ('Sam Cassell', 'alien', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Terrell Brandon', 't-brandon', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf'),
  ('Todd Day', 'day', 't-wolves', 'professional', 'https://cdn.wolveslynx.com/timberwolves/communications/guides/2024-25_Wolves-MediaGuide.pdf');

DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'dojo.homie'::regclass
      AND tgname = 'trg_sync_homie_tag_identity' AND tgenabled IN ('O', 'A')
      AND tgfoid = to_regprocedure('dojo.sync_homie_tag_identity_from_row()')
  ) THEN
    RAISE EXCEPTION 'required homie tag synchronization trigger is missing or disabled';
  END IF;

  IF to_regprocedure('dojo.create_missing_clan_tag(text,text)') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgrelid = 'dojo.clan'::regclass
         AND tgname = 'trg_create_missing_clan_tag' AND tgenabled IN ('O', 'A')
         AND tgfoid = to_regprocedure('dojo.create_missing_clan_tag_from_row()')
     ) THEN
    RAISE EXCEPTION 'required clan tag synchronization from migration 079 is missing or disabled';
  END IF;

  IF EXISTS (
    SELECT 1 FROM player_clan_reference_seed AS seed
    JOIN dojo.tags AS tag ON tag.slug = seed.clan_slug
    LEFT JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
    WHERE clan.id IS NULL
  ) THEN
    RAISE EXCEPTION 'proposed clan slug already belongs to a tag without its clan; review collision';
  END IF;

  IF EXISTS (
    SELECT seed.homie_name
    FROM player_tag_seed AS seed
    LEFT JOIN dojo.homie AS homie ON homie.name = seed.homie_name
    GROUP BY seed.homie_name, seed.tag_slug
    HAVING count(homie.id) <> 1
      OR bool_or(homie.tag_slug IS NOT NULL AND homie.tag_slug <> seed.tag_slug)
  ) THEN
    RAISE EXCEPTION 'player tag seed no longer matches one unambiguous homie; review source data';
  END IF;

  IF EXISTS (
    SELECT 1 FROM player_tag_seed AS seed
    JOIN dojo.homie AS homie ON homie.name = seed.homie_name
    JOIN dojo.tags AS tag ON tag.slug = seed.tag_slug
    WHERE homie.tag_slug IS NULL
  ) THEN
    RAISE EXCEPTION 'proposed player tag slug already belongs to an existing tag; review collision';
  END IF;
END;
$check$;

-- Preserve existing production rows; an older branch receives only these two
-- reviewed reference teams. Migration 079's trigger creates their canonical tags.
INSERT INTO dojo.clan (name, slug)
SELECT clan_name, clan_slug FROM player_clan_reference_seed
ON CONFLICT (slug) DO NOTHING;

-- Also cover an existing reference clan whose tag is missing.
DO $backfill$
BEGIN
  PERFORM dojo.create_missing_clan_tag(clan.slug, clan.name)
  FROM player_clan_reference_seed AS seed
  JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
  WHERE NOT EXISTS (SELECT 1 FROM dojo.tags AS tag WHERE tag.slug = clan.slug);
END;
$backfill$;

-- Migration 073's existing trigger supplies the tag, route, identity metadata
-- and audit values. Do not overwrite any already assigned homie identity.
UPDATE dojo.homie AS homie
SET tag_slug = seed.tag_slug
FROM player_tag_seed AS seed
WHERE homie.name = seed.homie_name AND homie.tag_slug IS NULL;

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM player_tag_seed AS seed
    LEFT JOIN dojo.homie AS homie
      ON homie.name = seed.homie_name AND homie.tag_slug = seed.tag_slug
    LEFT JOIN dojo.tags AS tag ON tag.slug = seed.tag_slug
    WHERE homie.id IS NULL OR tag.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a new player tag identity was not created; transaction aborted';
  END IF;

  SELECT string_agg(
    format('%s [%s -> %s]: %s', seed.homie_name, seed.source_slug, seed.clan_slug,
      concat_ws(', ',
        CASE WHEN homie.id IS NULL THEN 'homie name/tag assignment missing or changed' END,
        CASE WHEN source_tag.id IS NULL THEN 'player tag missing' END,
        CASE WHEN clan.id IS NULL THEN 'clan missing' END,
        CASE WHEN target_tag.id IS NULL THEN 'clan tag missing' END,
        CASE WHEN source_tag.id = target_tag.id THEN 'player and clan share one tag' END
      )), E'\n' ORDER BY seed.clan_slug, seed.homie_name
    ) INTO endpoint_problems
    FROM player_clan_seed AS seed
    LEFT JOIN dojo.homie AS homie
      ON homie.tag_slug = seed.source_slug AND homie.name = seed.homie_name
    LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    LEFT JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
    LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
    WHERE homie.id IS NULL OR source_tag.id IS NULL
      OR clan.id IS NULL OR target_tag.id IS NULL OR source_tag.id = target_tag.id;
  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'a reviewed player/clan endpoint is missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review each listed endpoint, then ROLLBACK and rerun the complete migration.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', jsonb_build_object(
  'affiliation_scope', seed.affiliation_scope,
  'membership_basis', 'played_for',
  'evidence_url', seed.evidence_url,
  'reviewed_on', '2026-10-24',
  'migration', '080_populate_player_clan_memberships'
)
FROM player_clan_seed AS seed
JOIN dojo.homie AS homie
  ON homie.tag_slug = seed.source_slug AND homie.name = seed.homie_name
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

-- Confirm every reviewed pair exists, including pre-existing edges.
DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM player_clan_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed player/clan membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
