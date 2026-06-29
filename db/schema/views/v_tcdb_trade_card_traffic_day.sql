CREATE OR REPLACE VIEW dojo.v_tcdb_trade_card_traffic_day AS
SELECT
  traffic.traffic_date,
  COUNT(*) AS trade_count,
  SUM(traffic.card_total) AS card_total
FROM dojo.v_tcdb_trade_card_traffic_trade AS traffic
WHERE traffic.traffic_date IS NOT NULL
GROUP BY traffic.traffic_date;
