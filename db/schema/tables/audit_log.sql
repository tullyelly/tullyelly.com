CREATE TABLE IF NOT EXISTS dojo.audit_log
(
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    ts              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actor_user_id   UUID,
    action          TEXT                                                   NOT NULL,
    target_user_id  UUID,
    feature_key     TEXT,
    effect          TEXT,
    request_id      TEXT,
    ip              INET,
    meta            JSONB,
    PRIMARY KEY (id),
    CONSTRAINT audit_log_actor_user_id_fkey
        FOREIGN KEY (actor_user_id) REFERENCES auth.users (id)
            ON DELETE SET NULL,
    CONSTRAINT audit_log_target_user_id_fkey
        FOREIGN KEY (target_user_id) REFERENCES auth.users (id)
            ON DELETE SET NULL,
    CONSTRAINT audit_log_effect_check
        CHECK (effect IS NULL OR effect = ANY (ARRAY[
            'allow'::TEXT,
            'deny'::TEXT,
            'success'::TEXT,
            'error'::TEXT
        ]))
);

COMMENT ON TABLE dojo.audit_log IS
    'Application audit events for authorization and authenticated mutations';

CREATE INDEX IF NOT EXISTS ix_audit_log_ts
    ON dojo.audit_log (ts DESC);

CREATE INDEX IF NOT EXISTS ix_audit_log_actor_user_id
    ON dojo.audit_log (actor_user_id);

CREATE INDEX IF NOT EXISTS ix_audit_log_feature_key
    ON dojo.audit_log (feature_key);

ALTER TABLE dojo.audit_log
    OWNER TO tullyelly_admin;
