-- WU-1212: Read-only after James collects/repeats an exact completed UTC day.
-- DataGrip parameters: project_id, day, api_pageviews, api_visitors.
-- Supply independently observed API totals, never guesses or empty-as-zero.
-- Match the existing development connection's Host before executing.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_database() AS database,current_user AS role,
       current_setting('transaction_read_only') AS read_only;

WITH parameters AS (
  SELECT CAST(:project_id AS text) AS project_id,CAST(:day AS date) AS day,
         CAST(:api_pageviews AS bigint) AS api_pageviews,
         CAST(:api_visitors AS bigint) AS api_visitors
), page_metrics AS (
  SELECT count(*) AS page_count,sum(p.pageviews) AS enumerated_pageviews,
         md5(coalesce(string_agg(
           jsonb_build_array(p.request_path,p.pageviews,p.visitors)::text,
           E'\n' ORDER BY p.request_path),'[]')) AS metric_fingerprint
  FROM dojo.analytics_page_day p JOIN parameters x
    ON p.project_id=x.project_id AND p.day=x.day
)
SELECT x.day,x.day < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date AS completed_utc_day,
       d.status,d.pageviews::text,d.visitors::text,d.collected_at,d.run_id,
       d.status IN ('complete','zero') AS verified,
       d.pageviews=x.api_pageviews AS matches_api_pageviews,
       d.visitors=x.api_visitors AS matches_api_visitors,
       m.page_count,coalesce(m.enumerated_pageviews,0)::text AS enumerated_pageviews,
       coalesce(m.enumerated_pageviews,0)=d.pageviews AS pages_reconcile,
       m.metric_fingerprint
FROM parameters x LEFT JOIN dojo.analytics_day d
  ON d.project_id=x.project_id AND d.day=x.day CROSS JOIN page_metrics m;

-- Retain only controlled provenance and cursor evidence, not user identities/errors.
SELECT lane,status,started_at,finished_at,processed_days,request_count,
       error_code IS NOT NULL AS has_error
FROM dojo.analytics_run WHERE project_id=CAST(:project_id AS text)
ORDER BY started_at DESC,id DESC LIMIT 10;
SELECT lane,start_day,end_day,available_from,next_day
FROM dojo.analytics_progress WHERE project_id=CAST(:project_id AS text)
ORDER BY lane;
ROLLBACK;
