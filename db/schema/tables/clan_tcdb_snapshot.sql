CREATE TABLE IF NOT EXISTS dojo.clan_tcdb_snapshot
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    clan_id    BIGINT                                             NOT NULL,
    card_count INTEGER                                            NOT NULL,
    ranking    INTEGER                                            NOT NULL,
    difference INTEGER                                            NOT NULL,
    ranking_at DATE                                               NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    FOREIGN KEY (clan_id) REFERENCES dojo.clan,
    CONSTRAINT clan_tcdb_snapshot_card_count_check
        CHECK (card_count >= 0),
    CONSTRAINT clan_tcdb_snapshot_ranking_check
        CHECK (ranking >= 0)
);

ALTER TABLE dojo.clan_tcdb_snapshot
    OWNER TO tullyelly_admin;

CREATE UNIQUE INDEX IF NOT EXISTS clan_tcdb_snapshot_unique_ranking_at
    ON dojo.clan_tcdb_snapshot (clan_id, ranking_at);

CREATE TRIGGER trg_audit_clan_tcdb_snapshot
    BEFORE INSERT OR UPDATE
    ON dojo.clan_tcdb_snapshot
    FOR EACH ROW
EXECUTE PROCEDURE dojo.audit_stamp_generic();
