-- 014_authz_membership_surface.sql
-- Authz membership view, policy revision helpers, and guarded grant/revoke functions.

SET search_path = dojo, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_authz_memberships AS
SELECT
  u.id AS user_id,
  u.email AS email,
  COALESCE(a.slug, '*global*') AS app_slug,
  r.name AS role,
  uar.created_at AS granted_at
FROM dojo.authz_user_app_role uar
JOIN auth.users u ON u.id = uar.user_id
LEFT JOIN dojo.authz_app a ON a.id = uar.app_id
JOIN dojo.authz_role r ON r.id = uar.role_id;

CREATE TABLE IF NOT EXISTS dojo.authz_policy_rev (
  user_id UUID PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION dojo.authz_get_revision(p_user_id UUID)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_revision BIGINT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT revision INTO v_revision
  FROM dojo.authz_policy_rev
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_revision, 0);
END;
$$;

CREATE OR REPLACE FUNCTION dojo.authz_bump_revision(p_user_id UUID)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  v_revision BIGINT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO dojo.authz_policy_rev (user_id, revision, updated_at)
  VALUES (p_user_id, 1, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id)
    DO UPDATE SET revision = dojo.authz_policy_rev.revision + 1,
                  updated_at = CURRENT_TIMESTAMP
    RETURNING revision INTO v_revision;

  RETURN v_revision;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.authz_assert_can(
  p_actor UUID,
  p_feature TEXT,
  p_app_slug TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_app_id BIGINT;
  v_has_allow BOOLEAN;
  v_has_deny BOOLEAN;
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'permission denied: actor required';
  END IF;

  IF p_feature IS NULL OR length(trim(p_feature)) = 0 THEN
    RAISE EXCEPTION 'permission denied: feature required';
  END IF;

  IF p_app_slug IS NOT NULL THEN
    SELECT id INTO v_app_id FROM dojo.authz_app WHERE slug = p_app_slug;
    IF v_app_id IS NULL THEN
      RAISE EXCEPTION 'Unknown app %', p_app_slug;
    END IF;
  END IF;

  WITH memberships AS (
    SELECT role_id, app_id
    FROM dojo.authz_user_app_role
    WHERE user_id = p_actor
  ), scoped AS (
    SELECT rf.effect, f.enabled
    FROM memberships m
    JOIN dojo.authz_role_feature rf ON rf.role_id = m.role_id
    JOIN dojo.authz_feature f ON f.id = rf.feature_id
    WHERE f.key = p_feature
      AND (v_app_id IS NULL OR f.app_id = v_app_id)
      AND (m.app_id IS NULL OR m.app_id = f.app_id)
  )
  SELECT
    COALESCE(BOOL_OR(effect = 'allow' AND enabled), FALSE),
    COALESCE(BOOL_OR(effect = 'deny'), FALSE)
  INTO v_has_allow, v_has_deny
  FROM scoped;

  IF v_has_deny OR NOT v_has_allow THEN
    RAISE EXCEPTION 'permission denied for %', p_feature;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.authz_grant_role(
  p_actor UUID,
  p_user_id UUID,
  p_role TEXT,
  p_app_slug TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_role_id BIGINT;
  v_app_id BIGINT;
  v_inserted BOOLEAN;
BEGIN
  PERFORM dojo.authz_assert_can(p_actor, 'admin.membership.manage', 'admin');

  SELECT id INTO v_role_id FROM dojo.authz_role WHERE name = p_role;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Unknown role %', p_role;
  END IF;

  IF p_app_slug IS NOT NULL THEN
    SELECT id INTO v_app_id FROM dojo.authz_app WHERE slug = p_app_slug;
    IF v_app_id IS NULL THEN
      RAISE EXCEPTION 'Unknown app %', p_app_slug;
    END IF;
  END IF;

  v_inserted := FALSE;
  INSERT INTO dojo.authz_user_app_role (user_id, app_id, role_id)
  VALUES (p_user_id, v_app_id, v_role_id)
  ON CONFLICT (user_id, role_id, app_id) DO NOTHING
  RETURNING TRUE INTO v_inserted;

  IF v_inserted THEN
    PERFORM dojo.authz_bump_revision(p_user_id);
    PERFORM pg_notify('authz_changed', p_user_id::text);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION dojo.authz_revoke_role(
  p_actor UUID,
  p_user_id UUID,
  p_role TEXT,
  p_app_slug TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_role_id BIGINT;
  v_app_id BIGINT;
  v_deleted BOOLEAN;
BEGIN
  PERFORM dojo.authz_assert_can(p_actor, 'admin.membership.manage', 'admin');

  SELECT id INTO v_role_id FROM dojo.authz_role WHERE name = p_role;
  IF v_role_id IS NULL THEN
    RETURN;
  END IF;

  IF p_app_slug IS NOT NULL THEN
    SELECT id INTO v_app_id FROM dojo.authz_app WHERE slug = p_app_slug;
  END IF;

  v_deleted := FALSE;
  DELETE FROM dojo.authz_user_app_role
  WHERE user_id = p_user_id
    AND role_id = v_role_id
    AND ((app_id IS NULL AND p_app_slug IS NULL) OR app_id = v_app_id)
  RETURNING TRUE INTO v_deleted;

  IF v_deleted THEN
    PERFORM dojo.authz_bump_revision(p_user_id);
    PERFORM pg_notify('authz_changed', p_user_id::text);
  END IF;
END;
$$;

COMMIT;
