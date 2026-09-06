CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_fame_induction AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (collector.set_collector_header_id) collector.*
  FROM dojo.v_set_collector_header_snapshot collector
  WHERE collector.set_collector_snapshot_id IS NOT NULL
  ORDER BY collector.set_collector_header_id, collector.snapshot_date DESC, collector.set_collector_snapshot_id DESC
)
SELECT latest.set_collector_header_id, latest.set_slug, latest.set_name, latest.release_year,
  latest.manufacturer, NULLIF(BTRIM(latest.category_tag), '') AS category_tag,
  trade.trade_id, partner.id AS trade_partner_id, partner.tcdb_username, partner.name,
  COALESCE(MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')), latest.snapshot_date) AS inducted_date,
  latest.cards_owned, latest.total_cards
FROM latest_snapshot latest JOIN dojo.tcdb_trade trade ON trade.trade_id = latest.tcdb_trade_id
JOIN dojo.tcdb_trade_partner partner ON partner.id = trade.trade_partner_id
LEFT JOIN dojo.tcdb_trade_day day ON day.trade_id = trade.trade_id
WHERE latest.cards_owned = latest.total_cards
GROUP BY latest.set_collector_header_id, latest.set_slug, latest.set_name, latest.release_year,
  latest.manufacturer, NULLIF(BTRIM(latest.category_tag), ''), trade.trade_id, partner.id,
  partner.tcdb_username, partner.name, latest.snapshot_date, latest.cards_owned, latest.total_cards;
