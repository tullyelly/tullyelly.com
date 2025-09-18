CREATE TABLE IF NOT EXISTS homie_tcdb_snapshot
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    homie_id   BIGINT                                             NOT NULL,
    card_count INTEGER                                            NOT NULL,
    ranking    INTEGER                                            NOT NULL,
    difference INTEGER                                            NOT NULL,
    ranking_at DATE                                               NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    FOREIGN KEY (homie_id) REFERENCES homie,
    CONSTRAINT homie_tcdb_snapshot_card_count_check
        CHECK (card_count >= 0),
    CONSTRAINT homie_tcdb_snapshot_ranking_check
        CHECK (ranking >= 0)
);

ALTER TABLE homie_tcdb_snapshot
    OWNER TO tullyelly_admin;

CREATE UNIQUE INDEX IF NOT EXISTS homie_tcdb_snapshot_unique_ranking_at
    ON homie_tcdb_snapshot (homie_id, ranking_at);

CREATE TRIGGER trg_audit_homie_tcdb_snapshot
    BEFORE INSERT OR UPDATE
    ON homie_tcdb_snapshot
    FOR EACH ROW
EXECUTE PROCEDURE audit_stamp_generic();