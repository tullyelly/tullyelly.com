-- Split TCDb card traffic into sent and received series on their recorded days.

SET search_path = dojo, auth, public;

BEGIN;

DROP VIEW IF EXISTS dojo.v_tcdb_trade_card_traffic_day;
DROP VIEW IF EXISTS dojo.v_tcdb_trade_card_traffic_trade;

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_trade AS
SELECT
  trade.trade_id,
  MIN(day.trade_date) FILTER (WHERE day.side = 'sent') AS sent_date,
  MIN(day.trade_date)
    FILTER (WHERE day.side IN ('received', 'archived')) AS received_date,
  COALESCE(trade.sent, 0) AS sent,
  COALESCE(trade.received, 0) AS received
FROM dojo.tcdb_trade AS trade
LEFT JOIN dojo.tcdb_trade_day AS day
  ON day.trade_id = trade.trade_id
GROUP BY trade.trade_id, trade.sent, trade.received;

COMMENT ON VIEW dojo.v_tcdb_trade_card_traffic_trade IS
  'One TCDb card traffic row per trade with sent and received counts assigned to their recorded side dates; archived is a received-side completion.';

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_day AS
WITH traffic_events AS (
  SELECT
    traffic.sent_date AS traffic_date,
    traffic.sent,
    0::bigint AS received,
    1::bigint AS sent_trade_count,
    0::bigint AS received_trade_count
  FROM dojo.v_tcdb_trade_card_traffic_trade AS traffic
  WHERE traffic.sent_date IS NOT NULL

  UNION ALL

  SELECT
    traffic.received_date AS traffic_date,
    0::bigint AS sent,
    traffic.received,
    0::bigint AS sent_trade_count,
    1::bigint AS received_trade_count
  FROM dojo.v_tcdb_trade_card_traffic_trade AS traffic
  WHERE traffic.received_date IS NOT NULL
)
SELECT
  traffic.traffic_date,
  SUM(traffic.sent) AS sent,
  SUM(traffic.received) AS received,
  SUM(traffic.sent_trade_count) AS sent_trade_count,
  SUM(traffic.received_trade_count) AS received_trade_count
FROM traffic_events AS traffic
GROUP BY traffic.traffic_date;

COMMENT ON VIEW dojo.v_tcdb_trade_card_traffic_day IS
  'Daily sent and received TCDb card traffic; received includes archived completion-side dates.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_card_traffic_trade TO app_user;
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_card_traffic_day TO app_user;
  END IF;
END;
$$;

COMMIT;
