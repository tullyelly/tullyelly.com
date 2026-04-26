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
