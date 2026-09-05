CREATE OR REPLACE VIEW dojo.v_tcdb_trade_partner_summary AS
WITH trade_rollup AS (
  SELECT trade_partner_id, COUNT(*) AS trade_count, COALESCE(SUM(sent), 0) AS cards_sent, COALESCE(SUM(received), 0) AS cards_received
  FROM dojo.tcdb_trade GROUP BY trade_partner_id
), trade_dates AS (
  SELECT trade.trade_partner_id, MIN(day.trade_date) AS first_trade_date, MAX(day.trade_date) AS latest_trade_date
  FROM dojo.tcdb_trade trade JOIN dojo.tcdb_trade_day day ON day.trade_id = trade.trade_id GROUP BY trade.trade_partner_id
), hof AS (
  SELECT trade_partner_id, COUNT(*) AS hall_of_fame_count FROM dojo.v_tcdb_trade_hall_of_fame_induction GROUP BY trade_partner_id
)
SELECT partner.id AS trade_partner_id, partner.tcdb_username, partner.name, partner.city_state, partner.country,
  COALESCE(trade_rollup.trade_count, 0) AS trade_count, COALESCE(trade_rollup.cards_sent, 0) AS cards_sent,
  COALESCE(trade_rollup.cards_received, 0) AS cards_received,
  COALESCE(trade_rollup.cards_sent, 0) + COALESCE(trade_rollup.cards_received, 0) AS total_cards_exchanged,
  trade_dates.first_trade_date, trade_dates.latest_trade_date, COALESCE(hof.hall_of_fame_count, 0) AS hall_of_fame_count
FROM dojo.tcdb_trade_partner partner LEFT JOIN trade_rollup ON trade_rollup.trade_partner_id = partner.id
LEFT JOIN trade_dates ON trade_dates.trade_partner_id = partner.id LEFT JOIN hof ON hof.trade_partner_id = partner.id;
