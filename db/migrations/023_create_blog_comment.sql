-- 023_create_blog_comment.sql
-- Chronicles comments; immutable inserts only.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE IF NOT EXISTS dojo.blog_comment (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comment_post_created_at ON dojo.blog_comment (post_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comment_user_created_at ON dojo.blog_comment (user_id, created_at DESC);

COMMIT;
