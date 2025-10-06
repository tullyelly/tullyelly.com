-- 017_authz_effective_features.sql
-- View exposing distinct enabled features per user derived from role memberships.

SET search_path = dojo, public;

CREATE OR REPLACE VIEW dojo.v_authz_effective_features AS
WITH membership AS (
  SELECT
    uar.user_id,
    f.key AS feature_key,
    rf.effect,
    f.enabled
  FROM dojo.authz_user_app_role uar
  JOIN dojo.authz_role_feature rf ON rf.role_id = uar.role_id
  JOIN dojo.authz_feature f ON f.id = rf.feature_id
  WHERE uar.app_id IS NULL OR uar.app_id = f.app_id
)
SELECT m.user_id, m.feature_key
FROM membership m
WHERE m.effect = 'allow'
  AND m.enabled
  AND NOT EXISTS (
    SELECT 1
    FROM membership d
    WHERE d.user_id = m.user_id
      AND d.feature_key = m.feature_key
      AND d.effect = 'deny'
  )
GROUP BY m.user_id, m.feature_key;

COMMENT ON VIEW dojo.v_authz_effective_features IS
  'Distinct enabled features per user derived from role memberships (deny beats allow).';
