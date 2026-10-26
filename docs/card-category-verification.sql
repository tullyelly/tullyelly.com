-- Preflight: strictly read-only; safe before the new schema exists. No ledger initialization.
BEGIN READ ONLY;
SELECT current_database(), current_user;
SELECT to_regclass('dojo.card_category') AS category_table,
  to_regclass('dojo.card_category_snapshot') AS snapshot_table,
  to_regclass('dojo.v_card_category_snapshot') AS history_view,
  to_regclass('dojo.v_card_category_current') AS current_view,
  to_regclass('dojo.audit_log') AS audit_table,
  to_regprocedure('dojo.audit_stamp_generic()') AS audit_stamp;
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema = 'dojo' AND table_name = 'card_category_snapshot'
ORDER BY ordinal_position;
SELECT lower(btrim(category_tag)) AS label, count(*)
FROM dojo.set_collector_header
WHERE lower(btrim(category_tag)) IN
  ('baseball','basketball','boxing','football','gaming','golf','hockey','multi-sport','non-sport')
GROUP BY 1 ORDER BY 1;
SELECT app.slug, feature.key, feature.enabled, role.name, grant_row.effect
FROM dojo.authz_feature AS feature
JOIN dojo.authz_app AS app ON app.id = feature.app_id
LEFT JOIN dojo.authz_role_feature AS grant_row ON grant_row.feature_id = feature.id
LEFT JOIN dojo.authz_role AS role ON role.id = grant_row.role_id
WHERE feature.key IN ('tcdb.snapshot.create', 'menu.cardattack.clans',
 'tcdb.category.snapshot.create','tcdb.category.snapshot.correct','menu.cardattack.categories')
ORDER BY feature.key, role.name;
SELECT id, parent_id, persona, kind, label, href, published, hidden
FROM dojo.menu_node WHERE persona = 'cardattack' ORDER BY order_index, id;
COMMIT;

-- Post-application only: run this section separately after all four migrations.
BEGIN READ ONLY;
SELECT slug, name, card_count, measured_on, previous_count, previous_date, count_change,
 ranking, previous_ranking, rank_delta, trend_rank,
 difference, previous_difference, diff_delta, trend_overall, diff_sign_changed
FROM dojo.v_card_category_current ORDER BY slug;
SELECT category.slug, count(snapshot.id) AS measurements
FROM dojo.card_category AS category
LEFT JOIN dojo.card_category_snapshot AS snapshot ON snapshot.category_id = category.id
GROUP BY category.slug ORDER BY category.slug;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid IN ('dojo.card_category'::regclass, 'dojo.card_category_snapshot'::regclass);
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'dojo' AND tablename IN ('card_category','card_category_snapshot');
SELECT pg_get_viewdef('dojo.v_card_category_snapshot'::regclass, TRUE),
 pg_get_viewdef('dojo.v_card_category_current'::regclass, TRUE);
SELECT has_table_privilege(current_user, 'dojo.v_card_category_current', 'SELECT') AS overview_read,
 has_table_privilege(current_user, 'dojo.v_card_category_snapshot', 'SELECT') AS history_read,
 has_table_privilege(current_user, 'dojo.card_category', 'SELECT') AS category_read,
 has_table_privilege(current_user, 'dojo.card_category_snapshot', 'SELECT,INSERT,UPDATE') AS snapshot_write,
 has_sequence_privilege(current_user, pg_get_serial_sequence('dojo.card_category_snapshot','id'), 'USAGE') AS snapshot_identity,
 has_table_privilege(current_user, 'dojo.audit_log', 'INSERT') AS audit_write,
 has_sequence_privilege(current_user, pg_get_serial_sequence('dojo.audit_log','id'), 'USAGE') AS audit_identity;
-- After a manual API save/correction, inspect actor and before/after provenance.
SELECT action, actor_user_id, ts, meta FROM dojo.audit_log
WHERE action IN ('tcdb.category.snapshot.create','tcdb.category.snapshot.correct')
ORDER BY ts DESC, id DESC LIMIT 10;
COMMIT;
