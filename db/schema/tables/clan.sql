CREATE TABLE IF NOT EXISTS dojo.clan
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR(100)                                       NOT NULL,
    slug       VARCHAR(100)                                       NOT NULL,
    tag_slug   VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100)             DEFAULT CURRENT_USER,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    PRIMARY KEY (id),
    CONSTRAINT clan_slug_key
        UNIQUE (slug),
    CONSTRAINT clan_tag_slug_key
        UNIQUE (tag_slug),
    CONSTRAINT clan_tag_slug_check
        CHECK (tag_slug IS NULL OR tag_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT clan_slug_check
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

ALTER TABLE dojo.clan
    OWNER TO tullyelly_admin;

CREATE INDEX IF NOT EXISTS idx_clan_name
    ON dojo.clan (name ASC);

CREATE TRIGGER trg_audit_clan
    BEFORE INSERT OR UPDATE
    ON dojo.clan
    FOR EACH ROW
EXECUTE PROCEDURE dojo.audit_stamp_generic();
