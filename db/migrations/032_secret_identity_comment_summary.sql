-- 032_secret_identity_comment_summary.sql
-- Comment analytics grouped by secret identity tag.

SET search_path = dojo, auth, public;

BEGIN;

CREATE OR REPLACE VIEW dojo.v_secret_identity_comment_summary AS
SELECT
  t.slug AS tag_slug,
  t.name AS tag_name,
  COUNT(c.id) AS comment_count
FROM dojo.blog_comment c
JOIN auth.users u
  ON u.id = c.user_id
LEFT JOIN dojo.tags t
  ON t.id = u.secret_identity_tag_id
GROUP BY t.slug, t.name
ORDER BY comment_count DESC;

COMMENT ON VIEW dojo.v_secret_identity_comment_summary IS
  'Comment counts grouped by secret identity tag';

COMMIT;
