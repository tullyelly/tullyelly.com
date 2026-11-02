-- James-only atomic DataGrip bundle; checksum identifies the original migration file.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(hashtext('cipher:schema-migrations'));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
DO $ledger$
BEGIN
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '096%' AND filename <> '096_lowercase_visible_menu_labels.sql') THEN
    RAISE EXCEPTION '096 number is occupied; review separately';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '096_lowercase_visible_menu_labels.sql'
             AND (checksum IS DISTINCT FROM '01dd48d552bcb84193297aab0c283ba60734f099bb5d2d59b72b67167d756ce8' OR checksum_algorithm IS DISTINCT FROM 'sha256'
                  OR status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '096 ledger conflicts with reviewed file; aborting';
  END IF;
END;
$ledger$;
LOCK TABLE dojo.menu_node IN SHARE ROW EXCLUSIVE MODE;
-- Apply to potentially visible rows, including capability-gated links.
-- Preserve spelling, spacing and punctuation; only change letter case.
UPDATE dojo.menu_node
SET label = lower(label), updated_at = now(), updated_by = CURRENT_USER
WHERE published AND NOT hidden AND label IS DISTINCT FROM lower(label);
DO $labels$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dojo.v_menu_published WHERE NOT hidden) THEN
    RAISE EXCEPTION '096: no visible menu rows; verify target before recording effects';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.v_menu_published WHERE NOT hidden AND label IS DISTINCT FROM lower(label)) THEN
    RAISE EXCEPTION '096: published, non-hidden menu labels are not all lowercase';
  END IF;
END;
$labels$;
DO $ledger$
BEGIN
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename LIKE '096%' AND filename <> '096_lowercase_visible_menu_labels.sql') THEN
    RAISE EXCEPTION '096 number is occupied; review separately';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '096_lowercase_visible_menu_labels.sql'
             AND (checksum IS DISTINCT FROM '01dd48d552bcb84193297aab0c283ba60734f099bb5d2d59b72b67167d756ce8' OR checksum_algorithm IS DISTINCT FROM 'sha256'
                  OR status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION '096 ledger conflicts with reviewed file; aborting';
  END IF;
  INSERT INTO dojo.schema_migration
    (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
  SELECT '096_lowercase_visible_menu_labels.sql', '01dd48d552bcb84193297aab0c283ba60734f099bb5d2d59b72b67167d756ce8', 'sha256', 'applied', now(), now(), NULL, NULL
  WHERE NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '096_lowercase_visible_menu_labels.sql');
END;
$ledger$;
COMMIT;
