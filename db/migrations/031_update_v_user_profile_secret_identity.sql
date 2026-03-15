-- 031_update_v_user_profile_secret_identity.sql
-- Make v_user_profile prefer secret identity tags for the profile/session name.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_user_profile AS
SELECT
  u.id AS user_id,
  u.email,
  COALESCE(
    t.name,
    split_part(u.name, ' ', 1),
    split_part(u.email, '@', 1)
  ) AS name,
  u.image,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'provider', a.provider,
          'providerAccountId', a."providerAccountId",
          'type', a.type,
          'scope', a.scope,
          'expires_at', a.expires_at
        )
        ORDER BY a.provider, a."providerAccountId"
      )
      FROM auth.accounts a
      WHERE a."userId" = u.id
    ),
    '[]'::jsonb
  ) AS accounts,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'expires', s.expires
        )
        ORDER BY s.expires DESC
      )
      FROM auth.sessions s
      WHERE s."userId" = u.id
    ),
    '[]'::jsonb
  ) AS sessions,
  COALESCE(
    (
      SELECT jsonb_agg(m)
      FROM (
        SELECT user_id, email, app_slug, role, granted_at
        FROM dojo.v_authz_memberships m
        WHERE m.user_id = u.id
        ORDER BY granted_at DESC
      ) m
    ),
    '[]'::jsonb
  ) AS memberships,
  COALESCE(
    (
      SELECT array_agg(DISTINCT f.feature_key ORDER BY f.feature_key)
      FROM dojo.v_authz_effective_features f
      WHERE f.user_id = u.id
    ),
    '{}'::text[]
  ) AS features,
  dojo.authz_get_revision(u.id) AS revision
FROM auth.users u
LEFT JOIN dojo.tags t
  ON t.id = u.secret_identity_tag_id;

COMMENT ON VIEW dojo.v_user_profile IS
  'Per-user profile surface combining auth users/accounts/sessions with dojo memberships, effective features, and revision; tokens excluded.';

COMMIT;
