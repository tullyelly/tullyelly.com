CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_ranking_rt
(
    clan_id           BIGINT                                 NOT NULL,
    name              TEXT                                   NOT NULL,
    slug              TEXT                                   NOT NULL,
    card_count        INTEGER                                NOT NULL,
    ranking           INTEGER                                NOT NULL,
    ranking_at        DATE                                   NOT NULL,
    difference        INTEGER                                NOT NULL,
    prev_ranking      INTEGER,
    prev_difference   INTEGER,
    prev_ranking_at   DATE,
    rank_delta        INTEGER,
    diff_delta        INTEGER,
    trend_rank        TEXT,
    trend_overall     TEXT,
    diff_sign_changed BOOLEAN                  DEFAULT FALSE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (clan_id),
    CONSTRAINT clan_tcdb_ranking_rt_trend_rank_check
        CHECK (trend_rank = ANY (ARRAY ['up'::TEXT, 'down'::TEXT, 'flat'::TEXT])),
    CONSTRAINT clan_tcdb_ranking_rt_trend_overall_check
        CHECK (trend_overall = ANY (ARRAY ['up'::TEXT, 'down'::TEXT, 'flat'::TEXT]))
);

ALTER TABLE dojo.clan_tcdb_ranking_rt
    OWNER TO tullyelly_admin;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clan_tcdb_ranking_rt_slug
    ON dojo.clan_tcdb_ranking_rt (slug);

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_ranking_rt_rank
    ON dojo.clan_tcdb_ranking_rt (ranking ASC, ranking_at DESC);
