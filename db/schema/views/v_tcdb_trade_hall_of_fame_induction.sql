CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_fame_induction AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (snapshot.set_collector_header_id)
    snapshot.id,
    snapshot.set_collector_header_id,
    snapshot.snapshot_date,
    snapshot.cards_owned,
    snapshot.tcdb_trade_id
  FROM dojo.set_collector_snapshot AS snapshot
  ORDER BY
    snapshot.set_collector_header_id,
    snapshot.snapshot_date DESC,
    snapshot.id DESC
),
induction AS (
  SELECT
    header.id AS set_collector_header_id,
    header.set_slug,
    header.set_name,
    header.release_year,
    header.manufacturer,
    NULLIF(BTRIM(header.category_tag), '') AS category_tag,
    trade.trade_id,
    NULLIF(BTRIM(trade.partner), '') AS partner,
    COALESCE(
      MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')),
      latest_snapshot.snapshot_date
    ) AS inducted_date,
    latest_snapshot.cards_owned,
    header.total_cards
  FROM latest_snapshot
  INNER JOIN dojo.set_collector_header AS header
    ON header.id = latest_snapshot.set_collector_header_id
  INNER JOIN dojo.tcdb_trade AS trade
    ON trade.trade_id = latest_snapshot.tcdb_trade_id
  LEFT JOIN dojo.tcdb_trade_day AS day
    ON day.trade_id = trade.trade_id
  WHERE latest_snapshot.tcdb_trade_id IS NOT NULL
    AND latest_snapshot.cards_owned = header.total_cards
  GROUP BY
    header.id,
    header.set_slug,
    header.set_name,
    header.release_year,
    header.manufacturer,
    NULLIF(BTRIM(header.category_tag), ''),
    trade.trade_id,
    NULLIF(BTRIM(trade.partner), ''),
    latest_snapshot.snapshot_date,
    latest_snapshot.cards_owned,
    header.total_cards
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
