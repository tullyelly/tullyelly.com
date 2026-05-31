CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_snapshot_rt
(
    clan_id          BIGINT                                 NOT NULL,
    name             TEXT                                   NOT NULL,
    slug             TEXT                                   NOT NULL,
    card_count       INTEGER                                NOT NULL,
    ranking          INTEGER                                NOT NULL,
    ranking_at       DATE                                   NOT NULL,
    difference       INTEGER                                NOT NULL,
    prev_card_count  INTEGER,
    prev_ranking     INTEGER,
    prev_difference  INTEGER,
    prev_ranking_at  DATE,
    card_count_delta INTEGER,
    rank_delta       INTEGER,
    diff_delta       INTEGER,
    trend_rank       TEXT,
    trend_overall    TEXT,
    diff_sign_changed BOOLEAN                 DEFAULT FALSE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (clan_id, ranking_at),
    CONSTRAINT clan_tcdb_snapshot_rt_trend_rank_check
        CHECK (trend_rank = ANY (ARRAY ['up'::TEXT, 'down'::TEXT, 'flat'::TEXT])),
    CONSTRAINT clan_tcdb_snapshot_rt_trend_overall_check
        CHECK (trend_overall = ANY (ARRAY ['up'::TEXT, 'down'::TEXT, 'flat'::TEXT]))
);

ALTER TABLE dojo.clan_tcdb_snapshot_rt
    OWNER TO tullyelly_admin;

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_snapshot_rt_rank
    ON dojo.clan_tcdb_snapshot_rt (ranking_at DESC, ranking ASC);

CREATE INDEX IF NOT EXISTS idx_clan_tcdb_snapshot_rt_slug
    ON dojo.clan_tcdb_snapshot_rt (slug, ranking_at DESC);
