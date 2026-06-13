-- 053_create_set_collector_header_snapshot_view.sql
-- Expose Set Collector headers with their snapshot history in one read-friendly
-- view while preserving every source column with unambiguous names.

SET search_path = dojo, auth, public;

CREATE OR REPLACE VIEW dojo.v_set_collector_header_snapshot AS
SELECT
  header.id AS set_collector_header_id,
  header.set_slug,
  header.set_name,
  header.release_year,
  header.manufacturer,
  header.tcdb_set_url,
  header.completed_set_photo_path,
  header.category_tag,
  header.rating,
  header.total_cards,
  header.created_at AS header_created_at,
  header.created_by AS header_created_by,
  header.updated_at AS header_updated_at,
  header.updated_by AS header_updated_by,
  snapshot.id AS set_collector_snapshot_id,
  snapshot.set_collector_header_id AS snapshot_set_collector_header_id,
  snapshot.snapshot_date,
  snapshot.cards_owned,
  snapshot.tcdb_trade_id,
  snapshot.created_at AS snapshot_created_at,
  snapshot.created_by AS snapshot_created_by,
  snapshot.updated_at AS snapshot_updated_at,
  snapshot.updated_by AS snapshot_updated_by
FROM dojo.set_collector_header AS header
LEFT JOIN dojo.set_collector_snapshot AS snapshot
  ON snapshot.set_collector_header_id = header.id;

COMMENT ON VIEW dojo.v_set_collector_header_snapshot IS
  'All Set Collector header columns joined to all snapshot columns, with source-specific aliases for overlapping names.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_set_collector_header_snapshot TO app_user;
  END IF;
END;
$$;

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_fame_induction AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (collector.set_collector_header_id)
    collector.set_collector_header_id,
    collector.set_slug,
    collector.set_name,
    collector.release_year,
    collector.manufacturer,
    collector.category_tag,
    collector.snapshot_date,
    collector.cards_owned,
    collector.total_cards,
    collector.tcdb_trade_id
  FROM dojo.v_set_collector_header_snapshot AS collector
  WHERE collector.set_collector_snapshot_id IS NOT NULL
  ORDER BY
    collector.set_collector_header_id,
    collector.snapshot_date DESC,
    collector.set_collector_snapshot_id DESC
),
induction AS (
  SELECT
    latest_snapshot.set_collector_header_id,
    latest_snapshot.set_slug,
    latest_snapshot.set_name,
    latest_snapshot.release_year,
    latest_snapshot.manufacturer,
    NULLIF(BTRIM(latest_snapshot.category_tag), '') AS category_tag,
    trade.trade_id,
    NULLIF(BTRIM(trade.partner), '') AS partner,
    COALESCE(
      MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')),
      latest_snapshot.snapshot_date
    ) AS inducted_date,
    latest_snapshot.cards_owned,
    latest_snapshot.total_cards
  FROM latest_snapshot
  INNER JOIN dojo.tcdb_trade AS trade
    ON trade.trade_id = latest_snapshot.tcdb_trade_id
  LEFT JOIN dojo.tcdb_trade_day AS day
    ON day.trade_id = trade.trade_id
  WHERE latest_snapshot.tcdb_trade_id IS NOT NULL
    AND latest_snapshot.cards_owned = latest_snapshot.total_cards
  GROUP BY
    latest_snapshot.set_collector_header_id,
    latest_snapshot.set_slug,
    latest_snapshot.set_name,
    latest_snapshot.release_year,
    latest_snapshot.manufacturer,
    NULLIF(BTRIM(latest_snapshot.category_tag), ''),
    trade.trade_id,
    NULLIF(BTRIM(trade.partner), ''),
    latest_snapshot.snapshot_date,
    latest_snapshot.cards_owned,
    latest_snapshot.total_cards
)
SELECT
  set_collector_header_id,
  set_slug,
  set_name,
  release_year,
  manufacturer,
  category_tag,
  trade_id,
  partner,
  inducted_date,
  cards_owned,
  total_cards
FROM induction;

COMMENT ON VIEW dojo.v_tcdb_trade_hall_of_fame_induction IS
  'One TCDb Trade Hall of Fame induction per latest completed Set Collector snapshot linked to a TCDb trade.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_hall_of_fame_induction TO app_user;
  END IF;
END;
$$;
