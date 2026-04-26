-- 048_create_tcdb_trade_hall_of_fame_views.sql
-- Build TCDb Trade Hall of Fame induction and partner summary views from the
-- set collector and normalized TCDb trade tables.

SET search_path = dojo, auth, public;

DROP VIEW IF EXISTS dojo.v_tcdb_trade_hall_of_famer;
DROP VIEW IF EXISTS dojo.v_tcdb_trade_hall_of_fame_induction;

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

COMMENT ON VIEW dojo.v_tcdb_trade_hall_of_fame_induction IS
  'One TCDb Trade Hall of Fame induction per latest completed Set Collector snapshot linked to a TCDb trade.';

CREATE OR REPLACE VIEW dojo.v_tcdb_trade_hall_of_famer AS
SELECT
  induction.partner,
  ARRAY_REMOVE(
    ARRAY_AGG(DISTINCT induction.category_tag ORDER BY induction.category_tag),
    NULL::TEXT
  ) AS category_tags,
  COUNT(*) AS induction_count,
  MAX(induction.inducted_date) AS latest_inducted_date
FROM dojo.v_tcdb_trade_hall_of_fame_induction AS induction
GROUP BY induction.partner;

COMMENT ON VIEW dojo.v_tcdb_trade_hall_of_famer IS
  'TCDb Trade Hall of Fame partner summary counts grouped from completed-set induction events.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_hall_of_fame_induction TO app_user;
    GRANT SELECT ON TABLE dojo.v_tcdb_trade_hall_of_famer TO app_user;
  END IF;
END;
$$;
