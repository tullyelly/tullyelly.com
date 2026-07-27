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
