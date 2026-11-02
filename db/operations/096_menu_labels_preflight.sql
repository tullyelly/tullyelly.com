-- Read-only: save all results for comparison and review planned labels.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SELECT current_database(), current_user, current_setting('transaction_read_only') AS read_only;
SELECT * FROM dojo.schema_migration ORDER BY filename;
SELECT count(*) AS total_rows,
       count(*) FILTER (WHERE published AND NOT hidden AND label IS DISTINCT FROM lower(label)) AS remaining_updates
FROM dojo.menu_node;
SELECT id, persona, href, label AS current_label, lower(label) AS proposed_label
FROM dojo.menu_node WHERE published AND NOT hidden AND label IS DISTINCT FROM lower(label)
ORDER BY persona, parent_id NULLS FIRST, order_index, id;
-- These three JSON results must be identical before/after execution.
SELECT jsonb_agg(to_jsonb(m) ORDER BY id) AS suppressed_rows_unchanged
FROM dojo.menu_node m WHERE hidden OR NOT published;
SELECT jsonb_agg(to_jsonb(m) - ARRAY['label', 'updated_at', 'updated_by'] ORDER BY id) AS preserved_fields
FROM dojo.menu_node m;
-- Normalize expected labels without ignoring audit changes on already-lowercase rows:
-- full snapshots below prove that only actual case changes receive update audits.
SELECT jsonb_agg(jsonb_build_object('id', id, 'label', lower(label)) ORDER BY id) AS expected_visible_labels
FROM dojo.menu_node WHERE published AND NOT hidden;
SELECT * FROM dojo.menu_node ORDER BY id;
COMMIT;
