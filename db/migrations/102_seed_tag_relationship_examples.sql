-- WU-1267: reviewed examples only; James executes development then approved production.
-- After successful COMMIT run the separate 102_record_applied.sql; never replay to repair its ledger.
BEGIN;
SET LOCAL search_path=pg_catalog;
SET LOCAL TimeZone='UTC';
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
LOCK TABLE dojo.homie,dojo.tags,dojo.tag_relation,dojo.clan,dojo.unclejimmy_squad_item IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.schema_migration IN SHARE MODE;
DO $history$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '102: wrong database'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '102%') THEN
    RAISE EXCEPTION '102: history exists; inspect instead of replaying'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='101_retarget_homie_alias_references.sql'
    AND checksum='24541ff0961e7f3e9a5d452984bbd7a8c32cf2f07778d328c2b2ec527b640470'
    AND checksum_algorithm='sha256' AND status='applied' AND applied_at IS NOT NULL AND error_message IS NULL) THEN
    RAISE EXCEPTION '102: recorded 101 prerequisite missing/conflicting'; END IF;
  IF EXISTS(SELECT 1 FROM pg_constraint WHERE contype='f' AND confrelid='dojo.tag_relation'::regclass) THEN
    RAISE EXCEPTION '102: relation has inbound references; review duplicate reconciliation'; END IF;
  PERFORM dojo.assert_homie_tag_exclusivity();
  PERFORM dojo.assert_typed_tag_relationships();
END;
$history$;
CREATE TEMP TABLE wu1267_tags_before ON COMMIT DROP AS SELECT * FROM dojo.tags;
CREATE TEMP TABLE wu1267_edges_before ON COMMIT DROP AS SELECT * FROM dojo.tag_relation;
CREATE TEMP TABLE wu1267_homies_before ON COMMIT DROP AS SELECT * FROM dojo.homie;
CREATE TEMP TABLE wu1267_membership_plan(legacy_id bigint,canonical_id bigint,legacy_row jsonb,canonical_row jsonb,expected_meta jsonb) ON COMMIT DROP;
INSERT INTO wu1267_membership_plan VALUES (213,462,'{"id":213,"meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:29:11.864487+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":23}'::jsonb,'{"id":462,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":213,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":23}'::jsonb,'{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":213,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"},"homie_sync_merged_edges":[{"id":213,"meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:29:11.864487+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":23}],"alias_seed_canonical_before":{"id":462,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":213,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":23}}'::jsonb),
(325,463,'{"id":325,"meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:53:51.751236+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":503}'::jsonb,'{"id":463,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":325,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":503}'::jsonb,'{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":325,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"},"homie_sync_merged_edges":[{"id":325,"meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:53:51.751236+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":503}],"alias_seed_canonical_before":{"id":463,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":325,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":503}}'::jsonb);
CREATE TEMP TABLE wu1267_seed(source_slug text,target_slug text,relation_type text,meta jsonb) ON COMMIT DROP;
INSERT INTO wu1267_seed VALUES ('lebron-james','king-james','alias_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","homie_id":6,"identity_evidence":["WU-1262 accepted record","db/migrations/080_populate_player_clan_memberships.sql","db/migrations/099_audit_homie_clan_memberships.sql"]}'::jsonb),
('calvin','cal','alias_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","identity_evidence":{"path":"content/chronicles/silent-reflection.mdx","line":43,"sha256":"a53e43173ffe7f353e552e4af837da27597c9c298e070c2c01c0dd414813fb76","meaning":"Authored nephews paragraph explicitly names Calvin through tag cal; not spelling inference."}}'::jsonb),
('king-james','lulu','collected_because_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","decision":"WU-1262","reasons":[{"code":"favorite_player","explanation":"I collect LeBron because he was Lulu''s favorite player."}]}'::jsonb);
DO $endpoints$
BEGIN
  IF EXISTS(SELECT 1 FROM (VALUES (1,'{"id":1,"href":"/unclejimmy/fam/lulu","meta":{"identity":{"kind":"person","contexts":{"unclejimmy":{"href":"/unclejimmy/fam/lulu","role":"fam"}}}},"name":"lulu","slug":"lulu","href_kind":"squad","created_at":"2026-03-14T18:42:58.144566+00:00","created_by":"tullyelly_admin","updated_at":"2026-09-20T23:51:34.193739+00:00","updated_by":"tullyelly_admin","display_name":"lulu","is_clickable":true}'::jsonb),
(33,'{"id":33,"href":"/unclejimmy/fam/cal","meta":{"identity":{"kind":"person","contexts":{"unclejimmy":{"href":"/unclejimmy/fam/cal","role":"fam"}}}},"name":"cal","slug":"cal","href_kind":"squad","created_at":"2026-08-17T19:16:49.264016+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-15T19:52:10.061389+00:00","updated_by":"tullyelly_admin","display_name":"cal","is_clickable":true}'::jsonb),
(274,'{"id":274,"href":"/unclejimmy/fam/the-lazer","meta":{"identity":{"kind":"person","contexts":{"unclejimmy":{"href":"/unclejimmy/fam/the-lazer","role":"fam"}}}},"name":"the-lazer","slug":"the-lazer","href_kind":"squad","created_at":"2026-09-21T00:07:53.065659+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-15T19:52:10.061389+00:00","updated_by":"tullyelly_admin","display_name":"the lazer","is_clickable":true}'::jsonb),
(392,'{"id":392,"href":"/cardattack/homies/lebron-james","meta":{"identity":{"kind":"person","contexts":{"cardattack":{"href":"/cardattack/homies/lebron-james","role":"homie"}}}},"name":"lebron-james","slug":"lebron-james","href_kind":"homie","created_at":"2026-10-24T21:29:11.864487+00:00","created_by":"tullyelly_admin","updated_at":"2026-10-24T21:29:11.864487+00:00","updated_by":null,"display_name":"lebron james","is_clickable":true}'::jsonb),
(540,'{"id":540,"href":"/cardattack/homies/king-james","meta":{"identity":{"kind":"person","contexts":{"cardattack":{"href":"/cardattack/homies/king-james","role":"homie"}}}},"name":"king-james","slug":"king-james","href_kind":"homie","created_at":"2026-11-05T05:11:48.919981+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-05T05:11:48.919981+00:00","updated_by":null,"display_name":"lebron james","is_clickable":true}'::jsonb),
(565,'{"id":565,"href":"/cardattack/homies/eldrid","meta":{"identity":{"kind":"person","contexts":{"cardattack":{"href":"/cardattack/homies/eldrid","role":"homie"}}},"homie_sync":{"href":"/cardattack/homies/eldrid","retired":false,"homie_id":221,"display_name":"cal eldrid"}},"name":"eldrid","slug":"eldrid","href_kind":"homie","created_at":"2026-11-15T16:18:00.031151+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-15T19:52:10.061389+00:00","updated_by":"tullyelly_admin","display_name":"cal eldrid","is_clickable":true}'::jsonb),
(566,'{"id":566,"href":"/cardattack/homies/lazer-face","meta":{"identity":{"kind":"person","contexts":{"cardattack":{"href":"/cardattack/homies/lazer-face","role":"homie"}}},"homie_sync":{"href":"/cardattack/homies/lazer-face","retired":false,"homie_id":219,"display_name":"lászló kleinheisler"}},"name":"lazer-face","slug":"lazer-face","href_kind":"homie","created_at":"2026-11-15T16:26:26.556676+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-15T19:52:10.061389+00:00","updated_by":"tullyelly_admin","display_name":"lászló kleinheisler","is_clickable":true}'::jsonb)) e(id,state)
    LEFT JOIN dojo.tags t ON t.id=e.id WHERE t.id IS NULL OR to_jsonb(t) IS DISTINCT FROM e.state) OR
    (SELECT to_jsonb(h) FROM dojo.homie h WHERE id=6) IS DISTINCT FROM '{"id":6,"name":"Lebron James","drafted":2003,"tag_slug":"king-james","created_at":"2025-07-29T16:12:59+00:00","created_by":"tullyelly_admin","updated_at":"2026-11-05T05:11:48.919981+00:00","updated_by":"tullyelly_admin"}'::jsonb THEN
    RAISE EXCEPTION '102: reviewed tag/owner state changed; preserve newer edits and review'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.homie WHERE tag_slug IN ('lebron-james','calvin')) OR
    dojo.homie_tag_reserved_reason(392) IS NOT NULL OR
    EXISTS(SELECT 1 FROM dojo.unclejimmy_squad_item WHERE slug='calvin' OR href IN
      ('/unclejimmy/fam/calvin','/unclejimmy/squads/calvin','/unclejimmy/squad/calvin')) THEN
    RAISE EXCEPTION '102: alternate name is claimed/reserved by another identity'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tags WHERE slug='calvin') AND NOT EXISTS(
    SELECT 1 FROM dojo.tags s JOIN dojo.tag_relation r ON r.source_tag_id=s.id
    JOIN wu1267_seed e ON e.source_slug='calvin' AND e.relation_type=r.relation_type AND e.meta=r.meta
    WHERE s.slug='calvin' AND s.name='calvin' AND s.display_name='calvin' AND s.href IS NULL
      AND s.href_kind='tag' AND s.is_clickable AND s.meta='{"identity":{"kind":"person"},"relationship_seed":"102_seed_tag_relationship_examples"}'::jsonb AND r.target_tag_id=33) THEN
    RAISE EXCEPTION '102: existing calvin tag is not this reviewed same-nephew alias; do not claim it'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation r JOIN dojo.tags s ON s.id=r.source_tag_id
    JOIN dojo.tags t ON t.id=r.target_tag_id JOIN wu1267_seed e ON (s.slug,t.slug,r.relation_type)=(e.source_slug,e.target_slug,e.relation_type)
    WHERE r.meta IS DISTINCT FROM e.meta) THEN
    RAISE EXCEPTION '102: existing seed pair has newer/intentional reasons or evidence; no overwrite'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE r.source_tag_id=392 AND r.relation_type='alias_of'
    AND NOT(r.target_tag_id=540 AND r.meta=(SELECT meta FROM wu1267_seed WHERE source_slug='lebron-james'))) THEN
    RAISE EXCEPTION '102: legacy LeBron has a different reviewed canonical target'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation r WHERE (r.source_tag_id=392 OR r.target_tag_id=392)
    AND r.id NOT IN (213,325) AND NOT(r.source_tag_id=392 AND r.target_tag_id=540 AND r.relation_type='alias_of'
      AND r.meta=(SELECT meta FROM wu1267_seed WHERE source_slug='lebron-james'))) THEN
    RAISE EXCEPTION '102: unreviewed legacy references changed; do not retarget by guessing'; END IF;
  IF EXISTS(SELECT 1 FROM dojo.tag_relation WHERE meta->>'migration'='102_seed_tag_relationship_examples') AND
    (SELECT count(*) FROM wu1267_seed e JOIN dojo.tags s ON s.slug=e.source_slug JOIN dojo.tags t ON t.slug=e.target_slug
      JOIN dojo.tag_relation r ON r.source_tag_id=s.id AND r.target_tag_id=t.id AND r.relation_type=e.relation_type AND r.meta=e.meta)<>3 THEN
    RAISE EXCEPTION '102: partial prior seed or intentional removal; inspect instead of re-seeding'; END IF;
END;
$endpoints$;
DO $memberships$
DECLARE p record; legacy jsonb; canonical jsonb;
BEGIN
  FOR p IN SELECT * FROM wu1267_membership_plan LOOP
    SELECT to_jsonb(r) INTO legacy FROM dojo.tag_relation r WHERE id=p.legacy_id;
    SELECT to_jsonb(r) INTO canonical FROM dojo.tag_relation r WHERE id=p.canonical_id;
    IF legacy IS NOT NULL AND legacy IS DISTINCT FROM p.legacy_row THEN
      RAISE EXCEPTION '102: legacy membership % changed; preserve and review',p.legacy_id; END IF;
    IF canonical IS NULL OR (canonical IS DISTINCT FROM p.canonical_row AND NOT(
      canonical->'meta'=p.expected_meta AND (canonical-'meta'-'updated_at'-'updated_by')=(p.canonical_row-'meta'-'updated_at'-'updated_by'))) THEN
      RAISE EXCEPTION '102: canonical membership % changed; preserve and review',p.canonical_id; END IF;
    IF legacy IS NULL AND canonical->'meta' IS DISTINCT FROM p.expected_meta THEN
      RAISE EXCEPTION '102: missing legacy membership % without complete retained archive',p.legacy_id; END IF;
  END LOOP;
END;
$memberships$;
-- Save complete legacy and original canonical row/audit evidence before removing only the proven duplicate.
UPDATE dojo.tag_relation r SET meta=p.expected_meta FROM wu1267_membership_plan p
WHERE r.id=p.canonical_id AND r.meta IS DISTINCT FROM p.expected_meta;
DELETE FROM dojo.tag_relation r USING wu1267_membership_plan p WHERE r.id=p.legacy_id;
INSERT INTO dojo.tags(slug,name,display_name,href,href_kind,is_clickable,meta)
SELECT 'calvin','calvin','calvin',NULL,'tag',true,'{"identity":{"kind":"person"},"relationship_seed":"102_seed_tag_relationship_examples"}'::jsonb
WHERE NOT EXISTS(SELECT 1 FROM dojo.tags WHERE slug='calvin');
INSERT INTO dojo.tag_relation(source_tag_id,target_tag_id,relation_type,meta)
SELECT s.id,t.id,e.relation_type,e.meta FROM wu1267_seed e
JOIN dojo.tags s ON s.slug=e.source_slug JOIN dojo.tags t ON t.slug=e.target_slug
ON CONFLICT (source_tag_id,relation_type,target_tag_id) DO NOTHING;
DO $effects$
BEGIN
  PERFORM dojo.assert_homie_tag_exclusivity();
  PERFORM dojo.assert_typed_tag_relationships();
  IF NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=6 AND name='Lebron James' AND drafted=2003 AND tag_slug='king-james') THEN
    RAISE EXCEPTION '102: current canonical LeBron owner changed'; END IF;
  IF EXISTS(SELECT 1 FROM (VALUES ('lebron-james','king-james','alias_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","homie_id":6,"identity_evidence":["WU-1262 accepted record","db/migrations/080_populate_player_clan_memberships.sql","db/migrations/099_audit_homie_clan_memberships.sql"]}'::jsonb),
('calvin','cal','alias_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","identity_evidence":{"path":"content/chronicles/silent-reflection.mdx","line":43,"sha256":"a53e43173ffe7f353e552e4af837da27597c9c298e070c2c01c0dd414813fb76","meaning":"Authored nephews paragraph explicitly names Calvin through tag cal; not spelling inference."}}'::jsonb),
('king-james','lulu','collected_because_of','{"migration":"102_seed_tag_relationship_examples","reviewed_on":"2026-11-15","decision":"WU-1262","reasons":[{"code":"favorite_player","explanation":"I collect LeBron because he was Lulu''s favorite player."}]}'::jsonb)) e(source_slug,target_slug,relation_type,meta)
    LEFT JOIN dojo.tags s ON s.slug=e.source_slug LEFT JOIN dojo.tags t ON t.slug=e.target_slug
    LEFT JOIN dojo.tag_relation r ON r.source_tag_id=s.id AND r.target_tag_id=t.id AND r.relation_type=e.relation_type
    WHERE r.id IS NULL OR r.meta IS DISTINCT FROM e.meta) THEN
    RAISE EXCEPTION '102: reviewed seed missing or newer intentional metadata; stop for review'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE slug='calvin' AND name='calvin' AND display_name='calvin'
    AND href IS NULL AND href_kind='tag' AND is_clickable AND meta='{"identity":{"kind":"person"},"relationship_seed":"102_seed_tag_relationship_examples"}'::jsonb) THEN
    RAISE EXCEPTION '102: reviewed alternate tag changed'; END IF;
  IF EXISTS(SELECT 1 FROM (VALUES (462,'{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":213,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"},"homie_sync_merged_edges":[{"id":213,"meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:29:11.864487+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":23}],"alias_seed_canonical_before":{"id":462,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":213,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"080_populate_player_clan_memberships","reviewed_on":"2026-10-24","evidence_url":"https://cdn.nba.com/teams/uploads/sites/1610612748/2023/11/2023-24-Miami-Heat-Media-Guide_39884007.pdf","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":23}}'::jsonb),
(463,'{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":325,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"},"homie_sync_merged_edges":[{"id":325,"meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"},"created_at":"2026-10-24T21:53:51.751236+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":392,"target_tag_id":503}],"alias_seed_canonical_before":{"id":463,"meta":{"migration":"099_audit_homie_clan_memberships","reviewed_on":"2026-11-15","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","copied_from_slug":"lebron-james","membership_basis":"played_for","original_edge_id":325,"affiliation_scope":"professional","identity_evidence":"db/migrations/080_populate_player_clan_memberships.sql","original_edge_meta":{"migration":"081_add_lakers_player_memberships","reviewed_on":"2026-10-24","evidence_url":"https://www.nba.com/news/lebron-james-lakers-legacy-closes","membership_basis":"played_for","affiliation_scope":"professional"}},"created_at":"2026-11-15T20:42:45.089428+00:00","created_by":"tullyelly_admin","updated_at":null,"updated_by":null,"relation_type":"member_of","source_tag_id":540,"target_tag_id":503}}'::jsonb)) e(id,meta)
    LEFT JOIN dojo.tag_relation r ON r.id=e.id WHERE r.id IS NULL OR r.source_tag_id<>540
    OR r.relation_type<>'member_of' OR r.meta IS DISTINCT FROM e.meta)
    OR EXISTS(SELECT 1 FROM dojo.tag_relation WHERE id IN (213,325)) THEN
    RAISE EXCEPTION '102: reviewed duplicate membership/evidence reconciliation differs'; END IF;
  IF NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=33 AND slug='cal' AND href='/unclejimmy/fam/cal'
    AND meta#>>'{identity,contexts,unclejimmy,role}'='fam') OR
    NOT EXISTS(SELECT 1 FROM dojo.tags WHERE id=274 AND slug='the-lazer' AND href='/unclejimmy/fam/the-lazer'
    AND meta#>>'{identity,contexts,unclejimmy,role}'='fam') OR
    NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=221 AND tag_slug='eldrid') OR
    NOT EXISTS(SELECT 1 FROM dojo.homie WHERE id=219 AND tag_slug='lazer-face') OR
    (SELECT count(*) FROM dojo.tag_relation WHERE (id,source_tag_id,target_tag_id,relation_type) IN
      ((14,274,270,'member_of'),(17,33,270,'member_of')))<>2 THEN
    RAISE EXCEPTION '102: protected family/athlete split or membership changed'; END IF;
END;
$effects$;
DO $preservation$
BEGIN
  IF EXISTS(SELECT * FROM wu1267_tags_before EXCEPT SELECT * FROM dojo.tags) OR
    EXISTS(SELECT 1 FROM dojo.tags t WHERE NOT EXISTS(SELECT 1 FROM wu1267_tags_before b WHERE b.id=t.id) AND t.slug<>'calvin') OR
    EXISTS((SELECT * FROM wu1267_homies_before EXCEPT SELECT * FROM dojo.homie)
      UNION ALL (SELECT * FROM dojo.homie EXCEPT SELECT * FROM wu1267_homies_before)) THEN
    RAISE EXCEPTION '102: unrelated tag/homie state changed'; END IF;
  IF EXISTS((SELECT * FROM wu1267_edges_before WHERE id NOT IN (213,325,462,463)
      EXCEPT SELECT * FROM dojo.tag_relation) UNION ALL
    (SELECT r.* FROM dojo.tag_relation r WHERE r.id NOT IN (462,463) AND NOT EXISTS(
      SELECT 1 FROM wu1267_seed e JOIN dojo.tags s ON s.slug=e.source_slug JOIN dojo.tags t ON t.slug=e.target_slug
      WHERE r.source_tag_id=s.id AND r.target_tag_id=t.id AND r.relation_type=e.relation_type AND r.meta=e.meta)
      EXCEPT SELECT * FROM wu1267_edges_before)) THEN
    RAISE EXCEPTION '102: unrelated relationship/evidence changed'; END IF;
  IF (SELECT count(*) FROM dojo.tag_relation WHERE relation_type='member_of') <>
    (SELECT count(*) FROM wu1267_edges_before WHERE relation_type='member_of' AND id NOT IN (213,325)) THEN
    RAISE EXCEPTION '102: membership cardinality changed outside reviewed duplicates'; END IF;
END;
$preservation$;
COMMIT;
