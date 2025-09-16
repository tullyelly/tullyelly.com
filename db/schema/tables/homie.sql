CREATE TABLE IF NOT EXISTS homie
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR(100)                                       NOT NULL,
    drafted    INTEGER                                            NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT homie_drafted_check
        CHECK ((drafted >= 0) AND (drafted <= 65535))
);

ALTER TABLE homie
    OWNER TO tullyelly_admin;

CREATE TRIGGER trg_audit_homie
    BEFORE INSERT OR UPDATE
    ON homie
    FOR EACH ROW
EXECUTE PROCEDURE audit_stamp_generic();