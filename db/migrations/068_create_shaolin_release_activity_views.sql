-- Derive non-overlapping Shaolin Scroll release windows and normalize meaningful
-- dated site activity. Chronicle publication and amendment activity remains in
-- Contentlayer because Chronicle MDX is its canonical source of truth.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_shaolin_site_activity AS
SELECT day.trade_date AS activity_date,
       'tcdb_trade'::text AS activity_type,
       day.side::text AS activity_subtype,
       trade.trade_id::text AS source_id,
       COALESCE(trade.partner, 'TCDb trade ' || trade.trade_id)::text AS title,
       CASE WHEN day.side = 'sent' THEN trade.sent ELSE trade.received END::bigint AS activity_value,
       ('/cardattack/tcdb-trades/' || trade.trade_id)::text AS destination_path,
       jsonb_strip_nulls(jsonb_build_object(
         'partner', trade.partner, 'sent', trade.sent, 'received', trade.received
       )) AS metadata
FROM dojo.tcdb_trade_day day
JOIN dojo.tcdb_trade trade ON trade.trade_id = day.trade_id
WHERE day.side IN ('sent', 'received')

UNION ALL

SELECT day.visit_date, 'lcs_visit', NULL, header.lcs_slug, header.lcs_name,
       NULL, '/cardattack/lcs/' || header.lcs_slug,
       jsonb_strip_nulls(jsonb_build_object(
         'city', header.city, 'state', header.state, 'rating', header.rating
       ))
FROM dojo.lcs_day day
JOIN dojo.lcs_header header ON header.id = day.lcs_header_id

UNION ALL

SELECT day.visit_date, 'usps_visit', NULL, header.city_slug, header.city_name,
       NULL, '/cardattack/usps/' || header.city_slug,
       jsonb_build_object('state', header.state, 'rating', header.rating)
FROM dojo.usps_day day
JOIN dojo.usps_header header ON header.id = day.usps_header_id

UNION ALL

SELECT reference.post_date, 'review', review_type.slug, subject.external_id,
       COALESCE(subject.name, reference.post_title), reference.rating_numeric,
       reference.post_url,
       jsonb_strip_nulls(jsonb_build_object(
         'reviewType', review_type.label, 'rating', reference.rating_raw,
         'chronicleTitle', reference.post_title
       ))
FROM dojo.review_reference reference
JOIN dojo.review_subject subject ON subject.id = reference.review_subject_id
JOIN dojo.review_type review_type ON review_type.id = subject.review_type_id

UNION ALL

SELECT day.build_date, 'bricks_build', header.subset, header.lego_id,
       header.set_name, NULL, '/unclejimmy/bricks/' || header.lego_id,
       jsonb_strip_nulls(jsonb_build_object('bags', day.bags, 'pieces', header.piece_count))
FROM dojo.bricks_day day
JOIN dojo.bricks_header header ON header.id = day.bricks_header_id

UNION ALL

SELECT snapshot.snapshot_date, 'set_collector', NULL, header.set_slug,
       header.set_name, snapshot.cards_owned,
       '/cardattack/set-collector/' || header.set_slug,
       jsonb_strip_nulls(jsonb_build_object(
         'cardsOwned', snapshot.cards_owned, 'totalCards', header.total_cards,
         'tradeId', snapshot.tcdb_trade_id
       ))
FROM dojo.set_collector_snapshot snapshot
JOIN dojo.set_collector_header header ON header.id = snapshot.set_collector_header_id;

COMMENT ON VIEW dojo.v_shaolin_site_activity IS
  'Meaningful dated public-site domain activity; excludes audit and incidental row timestamps.';

CREATE OR REPLACE VIEW dojo.v_shaolin_release_window AS
WITH release_bounds AS (
  SELECT scroll.id AS release_id,
         previous.release_date AS previous_release_date,
         scroll.release_date,
         scroll.release_date IS NULL AS is_in_progress
  FROM dojo.v_shaolin_scrolls scroll
  LEFT JOIN LATERAL (
    SELECT prior.release_date::date AS release_date
    FROM dojo.v_shaolin_scrolls prior
    WHERE prior.release_date IS NOT NULL
      AND prior.id <> scroll.id
      AND (
        scroll.release_date IS NULL
        OR prior.release_date::date < scroll.release_date::date
      )
    ORDER BY prior.release_date::date DESC, prior.id DESC
    LIMIT 1
  ) previous ON TRUE
)
SELECT bounds.release_id,
       COALESCE(
         bounds.previous_release_date + 1,
         earliest.activity_date,
         bounds.release_date::date,
         CURRENT_DATE
       )::date AS activity_start_date,
       COALESCE(bounds.release_date::date, CURRENT_DATE)::date AS activity_end_date,
       bounds.is_in_progress,
       bounds.previous_release_date
FROM release_bounds bounds
LEFT JOIN LATERAL (
  SELECT MIN(activity.activity_date) AS activity_date
  FROM dojo.v_shaolin_site_activity activity
  WHERE activity.activity_date <= COALESCE(bounds.release_date::date, CURRENT_DATE)
) earliest ON TRUE;

COMMENT ON VIEW dojo.v_shaolin_release_window IS
  'Release activity windows; start is the day after the prior completed release and end is the release date, or today while in progress.';

CREATE OR REPLACE VIEW dojo.v_shaolin_release_activity AS
SELECT release_window.release_id,
       activity.activity_date,
       activity.activity_type,
       activity.activity_subtype,
       activity.source_id,
       activity.title,
       activity.activity_value,
       activity.destination_path,
       activity.metadata
FROM dojo.v_shaolin_release_window release_window
JOIN dojo.v_shaolin_site_activity activity
  ON activity.activity_date
    BETWEEN release_window.activity_start_date AND release_window.activity_end_date;

COMMENT ON VIEW dojo.v_shaolin_release_activity IS
  'Normalized meaningful domain activity assigned dynamically to Shaolin Scroll release windows.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON TABLE dojo.v_shaolin_site_activity TO app_user;
    GRANT SELECT ON TABLE dojo.v_shaolin_release_window TO app_user;
    GRANT SELECT ON TABLE dojo.v_shaolin_release_activity TO app_user;
  END IF;
END;
$$;

COMMIT;
