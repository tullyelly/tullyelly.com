/* db/schema/tables/shaolin_scrolls.sql */
CREATE TABLE IF NOT EXISTS shaolin_scrolls
(
    id                BIGINT GENERATED ALWAYS AS IDENTITY,
    major             INTEGER                                            NOT NULL,
    minor             INTEGER                                            NOT NULL,
    patch             INTEGER                                            NOT NULL,
    year              SMALLINT                                           NOT NULL,
    month             SMALLINT                                           NOT NULL,
    label             VARCHAR(120)                                       NOT NULL,
    release_status_id SMALLINT                                           NOT NULL,
    release_type_id   SMALLINT                                           NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by        VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at        TIMESTAMP WITH TIME ZONE,
    updated_by        VARCHAR(100),
    release_date      DATE,
    PRIMARY KEY (id),
    CONSTRAINT uq_semver
        UNIQUE (major, minor, patch),
    FOREIGN KEY (release_status_id) REFERENCES release_status,
    FOREIGN KEY (release_type_id) REFERENCES release_type,
    CONSTRAINT shaolin_scrolls_major_check
        CHECK (major >= 0),
    CONSTRAINT shaolin_scrolls_minor_check
        CHECK (minor >= 0),
    CONSTRAINT shaolin_scrolls_patch_check
        CHECK (patch >= 0),
    CONSTRAINT shaolin_scrolls_year_check
        CHECK ((year >= 1970) AND (year <= 9999)),
    CONSTRAINT shaolin_scrolls_month_check
        CHECK ((month >= 1) AND (month <= 12)),
    CONSTRAINT chk_scrolls_released_iff_has_date
        CHECK ((release_status_id = 2) = (release_date IS NOT NULL))
);

COMMENT ON COLUMN shaolin_scrolls.release_date IS 'Date when the release is finalized (nullable until final step)';

ALTER TABLE shaolin_scrolls
    OWNER TO tullyelly_admin;

CREATE INDEX IF NOT EXISTS ix_shaolin_status
    ON shaolin_scrolls (release_status_id);

CREATE INDEX IF NOT EXISTS ix_shaolin_year_month
    ON shaolin_scrolls (year, month);

CREATE INDEX IF NOT EXISTS ix_shaolin_semver
    ON shaolin_scrolls (major, minor, patch);

CREATE INDEX IF NOT EXISTS ix_shaolin_release_type
    ON shaolin_scrolls (release_type_id);

CREATE TRIGGER trg_audit_shaolin_scrolls
    BEFORE INSERT OR UPDATE
    ON shaolin_scrolls
    FOR EACH ROW
EXECUTE PROCEDURE audit_stamp_generic();