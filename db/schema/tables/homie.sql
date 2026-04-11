CREATE TABLE IF NOT EXISTS homie
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR(100)                                       NOT NULL,
    tag_slug   VARCHAR(100),
    drafted    INTEGER                                            NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT homie_tag_slug_key
        UNIQUE (tag_slug),
    CONSTRAINT homie_tag_slug_check
        CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
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
