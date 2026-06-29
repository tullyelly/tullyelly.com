-- 055_create_tcdb_trade_card_traffic_views.sql
-- Normalize TCDb trade card traffic into one canonical chart date per trade.

SET search_path = dojo, auth, public;

BEGIN;

DROP VIEW IF EXISTS dojo.v_tcdb_trade_card_traffic_day;
DROP VIEW IF EXISTS dojo.v_tcdb_trade_card_traffic_trade;

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_trade AS
WITH trade_dates AS (
  SELECT
    trade.trade_id,
    MIN(day.trade_date) FILTER (WHERE day.side = 'sent') AS first_sent_date,
    MIN(day.trade_date) FILTER (WHERE day.side = 'received') AS first_received_date,
    MIN(day.trade_date) FILTER (WHERE day.side = 'archived') AS first_archived_date
  FROM dojo.tcdb_trade AS trade
  LEFT JOIN dojo.tcdb_trade_day AS day
    ON day.trade_id = trade.trade_id
  GROUP BY trade.trade_id
)
SELECT
  trade.trade_id,
  COALESCE(
    trade_dates.first_sent_date,
    trade_dates.first_received_date,
    trade_dates.first_archived_date
  ) AS traffic_date,
  COALESCE(trade.sent, 0) AS sent,
  COALESCE(trade.received, 0) AS received,
  COALESCE(trade.sent, 0) + COALESCE(trade.received, 0) AS card_total,
  CASE
    WHEN trade_dates.first_sent_date IS NOT NULL THEN 'sent'
    WHEN trade_dates.first_received_date IS NOT NULL THEN 'received'
    WHEN trade_dates.first_archived_date IS NOT NULL THEN 'archived'
    ELSE NULL
  END AS date_source
FROM dojo.tcdb_trade AS trade
LEFT JOIN trade_dates
  ON trade_dates.trade_id = trade.trade_id;

COMMENT ON VIEW dojo.v_tcdb_trade_card_traffic_trade IS
  'One canonical TCDb card traffic row per trade, dated by first sent day, else first received day, else first archived day.';

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_day AS
SELECT
  traffic.traffic_date,
  COUNT(*) AS trade_count,
  SUM(traffic.card_total) AS card_total
FROM dojo.v_tcdb_trade_card_traffic_trade AS traffic
WHERE traffic.traffic_date IS NOT NULL
GROUP BY traffic.traffic_date;

COMMENT ON VIEW dojo.v_tcdb_trade_card_traffic_day IS
  'Daily TCDb card traffic aggregated from one canonical row per trade.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_card_traffic_trade TO app_user;
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_card_traffic_day TO app_user;
  END IF;
END;
$$;

COMMIT;
