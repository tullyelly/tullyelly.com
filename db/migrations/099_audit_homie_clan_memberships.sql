-- WU-1272: seven researched career memberships and seventeen proven current-slug copies.
-- James executes existing development first, then approved production.
-- After success run db/operations/099_record_applied.sql; stop/ROLLBACK on failure.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
LOCK TABLE dojo.homie,dojo.clan,dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.schema_migration IN SHARE MODE;
DO $history$
BEGIN
 IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '099%') THEN
  RAISE EXCEPTION '099: number already recorded; verify history/effects instead of replaying';
 END IF;
END;
$history$;
CREATE TEMP TABLE audit_membership_seed (
 homie_id bigint NOT NULL, homie_name text NOT NULL, source_slug text NOT NULL,
 clan_id bigint NOT NULL, clan_slug text NOT NULL, legacy_slug text,
 legacy_edge_id bigint, legacy_meta jsonb, new_meta jsonb NOT NULL,
 PRIMARY KEY (source_slug,clan_slug)
) ON COMMIT DROP;
INSERT INTO audit_membership_seed VALUES
  (30, 'Stephen Curry', 'steph', 27, 'splash-bros', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nba.com/warriors/news/warriors-talk-curry-thompson-and-green-reflect-on-collective-greatness-20231129", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (123, 'Draymond Green', 'draymond-green', 27, 'splash-bros', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nba.com/warriors/news/warriors-talk-curry-thompson-and-green-reflect-on-collective-greatness-20231129", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (311, 'Klay Thompson', 'klay-thompson', 27, 'splash-bros', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nba.com/warriors/news/warriors-talk-curry-thompson-and-green-reflect-on-collective-greatness-20231129", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (6, 'Lebron James', 'king-james', 28, 'cavs', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nba.com/news/all-time-all-nba-first-team-cleveland-cavaliers", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (1203, 'Chris Paul', 'cp3', 32, 'aspiration', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nba.com/clippers/news/chris-paul-sets-clippers-franchise-record-assists", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (4, 'Brett Favre', 'brett-favre', 31, 'purple-people-eaters', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.nfl.com/players/brett-favre/stats/career", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (633, 'Aaron Jones', 'aaron-jones', 31, 'purple-people-eaters', NULL, NULL, NULL, '{"affiliation_scope": "professional", "membership_basis": "played_for", "evidence_url": "https://www.vikings.com/team/players-roster/aaron-jones/career", "reviewed_on": "2026-11-15", "migration": "099_audit_homie_clan_memberships"}'::jsonb),
  (6, 'Lebron James', 'king-james', 4, 'heat-culture', 'lebron-james', 213, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "lebron-james", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 213, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (6, 'Lebron James', 'king-james', 21, 'purple-and-gold', 'lebron-james', 325, '{"migration": "081_add_lakers_player_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/news/lebron-james-lakers-legacy-closes", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/news/lebron-james-lakers-legacy-closes", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "lebron-james", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 325, "original_edge_meta": {"migration": "081_add_lakers_player_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/news/lebron-james-lakers-legacy-closes", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (105, 'Jalen Rose', 'jalen', 18, 'suns', 'jalen-rose', 285, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/player/147/jalen_rose", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/player/147/jalen_rose", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "jalen-rose", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 285, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/player/147/jalen_rose", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (105, 'Jalen Rose', 'jalen', 24, 'raptors', 'jalen-rose', 373, '{"migration": "089_add_raptors_player_memberships", "reviewed_on": "2026-10-31", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "jalen-rose", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 373, "original_edge_meta": {"migration": "089_add_raptors_player_memberships", "reviewed_on": "2026-10-31", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (105, 'Jalen Rose', 'jalen', 26, 'fab-five', 'jalen-rose', 411, '{"migration": "092_add_michigan_and_restore_traylor_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943", "membership_basis": "played_for", "affiliation_scope": "college"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943", "membership_basis": "played_for", "affiliation_scope": "college", "copied_from_slug": "jalen-rose", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 411, "original_edge_meta": {"migration": "092_add_michigan_and_restore_traylor_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://mgoblue.com/sports/mens-basketball/roster/coaches/juwan-howard/5943", "membership_basis": "played_for", "affiliation_scope": "college"}}'::jsonb),
  (231, 'John Henson', 'whitefish-bay', 3, 'bucks-n-six', 'john-henson', 154, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/boeder-130420", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/bucks/features/boeder-130420", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "john-henson", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 154, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/boeder-130420", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (522, 'Johnny Newman', 'johnny', 3, 'bucks-n-six', 'johnny-newman', 155, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "johnny-newman", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 155, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/boeder-searching-for-the-most-90s-bucks-player", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (708, 'Moses Malone', 'moses', 3, 'bucks-n-six', 'moses-malone', 169, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/mb-130415", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/bucks/features/mb-130415", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "moses-malone", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 169, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/bucks/features/mb-130415", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (708, 'Moses Malone', 'moses', 9, 'rockets', 'moses-malone', 267, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "moses-malone", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 267, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://ak-static-int.nba.com/wp-content/uploads/sites/3/2016/10/2016-17-Media-Guide-Rockets.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (344, 'Patrick Williams', 'p-funk-fsu', 1, 'noles', 'patrick-williams', 243, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://seminoles.com/sports/mens-basketball/roster/patrick-williams/4422", "membership_basis": "played_for", "affiliation_scope": "college"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://seminoles.com/sports/mens-basketball/roster/patrick-williams/4422", "membership_basis": "played_for", "affiliation_scope": "college", "copied_from_slug": "patrick-williams", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 243, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://seminoles.com/sports/mens-basketball/roster/patrick-williams/4422", "membership_basis": "played_for", "affiliation_scope": "college"}}'::jsonb),
  (187, 'Tamarick Vanover', 'tamarick', 1, 'noles', 'tamarick-vanover', 247, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf", "membership_basis": "played_for", "affiliation_scope": "college"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf", "membership_basis": "played_for", "affiliation_scope": "college", "copied_from_slug": "tamarick-vanover", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 247, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://seminoles.com/documents/download/2023/6/27/2022-Honors.pdf", "membership_basis": "played_for", "affiliation_scope": "college"}}'::jsonb),
  (112, 'John Stockton', 'stockton', 29, 'jazz', 'john-stockton', 424, '{"migration": "093_add_jazz_player_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://www.nba.com/player/304", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/player/304", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "john-stockton", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 424, "original_edge_meta": {"migration": "093_add_jazz_player_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://www.nba.com/player/304", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (521, 'Dominique Wilkins', 'the-human-highlight-film', 22, 'green-beer', 'dominique-wilkins', 355, '{"migration": "082_add_celtics_player_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/team/1610612738/roster", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/team/1610612738/roster", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "dominique-wilkins", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 355, "original_edge_meta": {"migration": "082_add_celtics_player_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://www.nba.com/team/1610612738/roster", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (521, 'Dominique Wilkins', 'the-human-highlight-film', 30, 'the-monastery', 'dominique-wilkins', 440, '{"migration": "097_add_spurs_player_memberships", "reviewed_on": "2026-11-08", "evidence_url": "https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "dominique-wilkins", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 440, "original_edge_meta": {"migration": "097_add_spurs_player_memberships", "reviewed_on": "2026-11-08", "evidence_url": "https://en.wikipedia.org/wiki/San_Antonio_Spurs_all-time_roster", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (115, 'Vince Carter', 'vinsanity', 18, 'suns', 'vince-carter', 298, '{"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "vince-carter", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 298, "original_edge_meta": {"migration": "080_populate_player_clan_memberships", "reviewed_on": "2026-10-24", "evidence_url": "https://sunsdigital.com/mediaguide/2018-19PhoenixSunsMediaGuide.pdf", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (115, 'Vince Carter', 'vinsanity', 24, 'raptors', 'vince-carter', 374, '{"migration": "089_add_raptors_player_memberships", "reviewed_on": "2026-10-31", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "vince-carter", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 374, "original_edge_meta": {"migration": "089_add_raptors_player_memberships", "reviewed_on": "2026-10-31", "evidence_url": "https://www.dropbox.com/scl/fi/f5eeunlh1qsc6u6gx84pj/Toronto-Raptors-2025-26-Media-Guide-PR-website-friendly.pdf?dl=0&rlkey=2tw8gfyjkcg9rue5aitqajnen", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb),
  (115, 'Vince Carter', 'vinsanity', 25, 'vancouver', 'vince-carter', 397, '{"migration": "091_complete_homie_clan_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://www.nba.com/kings/news/kings-sign-vince-carter", "membership_basis": "played_for", "affiliation_scope": "professional"}'::jsonb, '{"migration": "099_audit_homie_clan_memberships", "reviewed_on": "2026-11-15", "evidence_url": "https://www.nba.com/kings/news/kings-sign-vince-carter", "membership_basis": "played_for", "affiliation_scope": "professional", "copied_from_slug": "vince-carter", "identity_evidence": "db/migrations/080_populate_player_clan_memberships.sql", "original_edge_id": 397, "original_edge_meta": {"migration": "091_complete_homie_clan_memberships", "reviewed_on": "2026-11-01", "evidence_url": "https://www.nba.com/kings/news/kings-sign-vince-carter", "membership_basis": "played_for", "affiliation_scope": "professional"}}'::jsonb);
DO $check$
DECLARE problems text;
BEGIN
 IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '099: unexpected database'; END IF;
 IF NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename='098_protect_homie_tag_identity.sql'
   AND status='applied' AND checksum='c7aae080b61d34d5a6e25ac861e3304153dbeb091401ec60c0f38dd46d13722d'
   AND checksum_algorithm='sha256' AND applied_at IS NOT NULL AND error_message IS NULL) THEN
   RAISE EXCEPTION '099: reviewed 098 prerequisite missing or conflicting';
 END IF;
 SELECT string_agg(s.source_slug||' -> '||s.clan_slug, ', ' ORDER BY s.source_slug,s.clan_slug) INTO problems
 FROM audit_membership_seed s
 LEFT JOIN dojo.homie h ON h.id=s.homie_id AND h.name=s.homie_name AND h.tag_slug=s.source_slug
 LEFT JOIN dojo.clan c ON c.id=s.clan_id AND c.slug=s.clan_slug
 LEFT JOIN dojo.tags src ON src.slug=s.source_slug
 LEFT JOIN dojo.tags dst ON dst.slug=s.clan_slug
 LEFT JOIN dojo.tags old ON old.slug=s.legacy_slug
 LEFT JOIN dojo.tag_relation legacy ON legacy.id=s.legacy_edge_id
 WHERE h.id IS NULL OR c.id IS NULL OR src.id IS NULL OR dst.id IS NULL OR src.id=dst.id
 OR (SELECT count(*) FROM dojo.homie hh WHERE hh.tag_slug=s.source_slug)<>1
 OR src.meta#>>'{identity,kind}' IS DISTINCT FROM 'person'
 OR src.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
 OR src.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM '/cardattack/homies/'||s.source_slug
 OR src.href IS DISTINCT FROM '/cardattack/homies/'||s.source_slug OR src.href_kind IS DISTINCT FROM 'homie'
 OR dojo.homie_tag_reserved_reason(src.id) IS NOT NULL
 OR dst.meta#>>'{identity,kind}' IS DISTINCT FROM 'group'
 OR dst.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan'
 OR dst.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM '/cardattack/clans/'||s.clan_slug
 OR dst.href IS DISTINCT FROM '/cardattack/clans/'||s.clan_slug OR dst.href_kind IS DISTINCT FROM 'clan'
 OR (s.legacy_slug IS NOT NULL AND (old.id IS NULL
   OR dojo.homie_tag_reserved_reason(old.id) IS NOT NULL
   OR EXISTS(SELECT 1 FROM dojo.homie hh WHERE hh.tag_slug=s.legacy_slug)
   OR old.meta#>>'{identity,kind}' IS DISTINCT FROM 'person'
   OR old.href_kind IS DISTINCT FROM 'homie'
   OR old.meta#>>'{identity,contexts,cardattack,href}' IS DISTINCT FROM '/cardattack/homies/'||s.legacy_slug
   OR old.href IS DISTINCT FROM '/cardattack/homies/'||s.legacy_slug
   OR old.meta#>>'{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
   OR legacy.source_tag_id IS DISTINCT FROM old.id OR legacy.target_tag_id IS DISTINCT FROM dst.id
   OR legacy.relation_type IS DISTINCT FROM 'member_of' OR legacy.meta IS DISTINCT FROM s.legacy_meta));
 IF problems IS NOT NULL THEN RAISE EXCEPTION '099: reviewed identity/evidence drift; stop' USING DETAIL=problems; END IF;
 PERFORM dojo.assert_homie_tag_exclusivity();
END;
$check$;

CREATE TEMP TABLE audit_edges_before ON COMMIT DROP AS SELECT * FROM dojo.tag_relation;
CREATE TEMP TABLE audit_tags_before ON COMMIT DROP AS SELECT * FROM dojo.tags;
CREATE TEMP TABLE audit_homies_before ON COMMIT DROP AS SELECT * FROM dojo.homie;
CREATE TEMP TABLE audit_clans_before ON COMMIT DROP AS SELECT * FROM dojo.clan;
INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
SELECT src.id,dst.id,'member_of',s.new_meta FROM audit_membership_seed s
JOIN dojo.tags src ON src.slug=s.source_slug JOIN dojo.tags dst ON dst.slug=s.clan_slug
ON CONFLICT(source_tag_id,relation_type,target_tag_id) DO NOTHING;
DO $check$
BEGIN
 IF EXISTS(SELECT 1 FROM audit_membership_seed s
   JOIN dojo.tags src ON src.slug=s.source_slug JOIN dojo.tags dst ON dst.slug=s.clan_slug
   WHERE NOT EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE r.source_tag_id=src.id
    AND r.target_tag_id=dst.id AND r.relation_type='member_of')) THEN
   RAISE EXCEPTION '099: reviewed direct membership missing';
 END IF;
END;
$check$;

DO $preserve$
BEGIN
 IF EXISTS(SELECT 1 FROM audit_edges_before b LEFT JOIN dojo.tag_relation r ON r.id=b.id
   WHERE to_jsonb(b) IS DISTINCT FROM to_jsonb(r))
 OR EXISTS(SELECT * FROM audit_tags_before EXCEPT SELECT * FROM dojo.tags)
 OR EXISTS(SELECT * FROM dojo.tags EXCEPT SELECT * FROM audit_tags_before)
 OR EXISTS(SELECT * FROM audit_homies_before EXCEPT SELECT * FROM dojo.homie)
 OR EXISTS(SELECT * FROM dojo.homie EXCEPT SELECT * FROM audit_homies_before)
 OR EXISTS(SELECT * FROM audit_clans_before EXCEPT SELECT * FROM dojo.clan)
 OR EXISTS(SELECT * FROM dojo.clan EXCEPT SELECT * FROM audit_clans_before) THEN
  RAISE EXCEPTION '099: unrelated rows or existing metadata changed; rollback';
 END IF;
 IF EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE NOT EXISTS(SELECT 1 FROM audit_edges_before b WHERE b.id=r.id)
  AND NOT EXISTS(SELECT 1 FROM audit_membership_seed s JOIN dojo.tags src ON src.slug=s.source_slug
   JOIN dojo.tags dst ON dst.slug=s.clan_slug WHERE r.source_tag_id=src.id AND r.target_tag_id=dst.id
    AND r.relation_type='member_of' AND r.meta=s.new_meta)) THEN
  RAISE EXCEPTION '099: unexpected inserted edge; rollback';
 END IF;
END;
$preserve$;
COMMIT;
