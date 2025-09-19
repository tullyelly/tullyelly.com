CREATE TABLE IF NOT EXISTS release_type
(
    id         SMALLSERIAL,
    code       TEXT                                               NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    UNIQUE (code),
    CONSTRAINT release_type_code_check
        CHECK (code ~ '^[a-z0-9_]+$'::TEXT)
);

ALTER TABLE release_type
    OWNER TO tullyelly_admin;

CREATE TRIGGER trg_audit_release_type
    BEFORE INSERT OR UPDATE
    ON release_type
    FOR EACH ROW
EXECUTE PROCEDURE audit_stamp_generic();