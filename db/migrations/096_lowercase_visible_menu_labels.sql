-- James executes manually; see docs/lowercase-menu-labels.md.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
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
COMMIT;
