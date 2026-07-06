CREATE OR REPLACE VIEW dojo.v_homie_tcdb_ranking_route AS
SELECT
    r.homie_id,
    NULLIF(btrim(h.tag_slug), '') AS tag_slug,
    COALESCE(NULLIF(btrim(h.tag_slug), ''), r.homie_id::text) AS route_slug,
    r.name,
    r.card_count,
    r.ranking,
    r.ranking_at,
    r.difference,
    r.prev_ranking,
    r.prev_difference,
    r.prev_ranking_at,
    r.rank_delta,
    r.diff_delta,
    r.trend_rank,
    r.trend_overall,
    r.diff_sign_changed,
    r.updated_at
FROM dojo.homie_tcdb_ranking_rt AS r
JOIN dojo.homie AS h
    ON h.id = r.homie_id;

ALTER VIEW dojo.v_homie_tcdb_ranking_route
    OWNER TO tullyelly_admin;
