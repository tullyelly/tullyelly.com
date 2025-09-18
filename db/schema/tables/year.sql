CREATE TABLE IF NOT EXISTS year
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    year       SMALLINT                                           NOT NULL,
    multi_year CHAR(7)                                            NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT uq_year_multi_year
        UNIQUE (year, multi_year),
    CONSTRAINT year_year_check
        CHECK ((year >= 1800) AND (year <= 3000))
);

ALTER TABLE year
    OWNER TO tullyelly_admin;

CREATE TRIGGER trg_audit_year
    BEFORE INSERT OR UPDATE
    ON year
    FOR EACH ROW
EXECUTE PROCEDURE audit_stamp_generic();