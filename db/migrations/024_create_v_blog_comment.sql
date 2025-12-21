-- 024_create_v_blog_comment.sql
-- Read surface for blog comments with author name.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_blog_comment AS
SELECT
  c.id,
  c.post_slug,
  c.user_id,
  COALESCE(u.name, u.email, 'Anonymous') AS user_name,
  c.body,
  c.created_at
FROM dojo.blog_comment c
LEFT JOIN auth.users u ON u.id = c.user_id;

COMMENT ON VIEW dojo.v_blog_comment IS
  'Blog comments joined with auth user display name.';

COMMIT;
