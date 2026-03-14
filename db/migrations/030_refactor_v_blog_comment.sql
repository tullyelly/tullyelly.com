-- 030_refactor_v_blog_comment.sql
-- Refactor blog comment reads to prefer secret identity tags for display names.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_blog_comment AS
SELECT
  c.id,
  c.post_slug,
  c.user_id,
  COALESCE(
    t.name,
    split_part(u.name, ' ', 1),
    split_part(u.email, '@', 1),
    'Anonymous'
  ) AS user_name,
  c.body,
  c.created_at
FROM dojo.blog_comment c
LEFT JOIN auth.users u
  ON u.id = c.user_id
LEFT JOIN dojo.tags t
  ON t.id = u.secret_identity_tag_id;

COMMENT ON VIEW dojo.v_blog_comment IS
  'Blog comments using secret identity tags when available';

COMMIT;
