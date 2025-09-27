AUDIT ; WU-375 (Spike)
Events (v1)

role_granted / role_revoked

actor_user_id, target_user_id, effect=success|error, meta (role, reason)

snapshot_created

actor_user_id, feature_key='tcdb.snapshot.create', effect=success|error, meta (inputs hash)

Include request_id and ip when available. Redact secrets. Retain 365d (tunable later).
