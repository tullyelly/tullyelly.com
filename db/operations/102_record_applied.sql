-- Generated offline. James runs this complete file ONLY after the canonical migration succeeds.
-- Canonical: db/migrations/102_seed_tag_relationship_examples.sql; SHA-256: a43c0b79b07766cfae67a0d821d2ee4fecabd7ee42f865af9aa969d3004235de
-- This file verifies effects and records history; it never replays the migration.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('cipher:schema-migrations',0));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger_guard$
BEGIN
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '102%' AND filename<>'102_seed_tag_relationship_examples.sql') THEN
    RAISE EXCEPTION '102: migration number occupied';
  END IF;
  IF EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='102_seed_tag_relationship_examples.sql' AND
    (checksum IS DISTINCT FROM 'a43c0b79b07766cfae67a0d821d2ee4fecabd7ee42f865af9aa969d3004235de' OR checksum_algorithm IS DISTINCT FROM 'sha256' OR
     status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '102: conflicting or failed ledger history; stop for review';
  END IF;
END;
$ledger_guard$;
-- Required effect checks run before any history is recorded, including on reruns.
SET LOCAL search_path=pg_catalog;
DO $target$
BEGIN
  IF current_database()<>'tullyelly_db' THEN RAISE EXCEPTION '102: wrong database'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION '102: use READ COMMITTED'; END IF;
END;
$target$;
SELECT pg_advisory_xact_lock(hashtextextended('cipher:homie-tag-identity',0));
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
INSERT INTO dojo.schema_migration
  (filename,checksum,checksum_algorithm,status,applied_at,attempted_at,execution_ms,error_message)
SELECT '102_seed_tag_relationship_examples.sql','a43c0b79b07766cfae67a0d821d2ee4fecabd7ee42f865af9aa969d3004235de','sha256','applied',now(),now(),NULL,NULL
WHERE NOT EXISTS(SELECT 1 FROM dojo.schema_migration WHERE filename='102_seed_tag_relationship_examples.sql');
COMMIT;
