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
