-- 062_add_scrolls_release_create_feature.sql
-- Register the Shaolin Scroll release creation capability.

SET search_path = dojo, public;

BEGIN;

INSERT INTO dojo.authz_app (slug, name, is_public)
VALUES ('scrolls', 'Shaolin Scrolls', FALSE)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      is_public = EXCLUDED.is_public;

WITH scrolls_app AS (
  SELECT id
    FROM dojo.authz_app
   WHERE slug = 'scrolls'
)
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT scrolls_app.id,
       'scrolls.release.create',
       'Create Shaolin Scroll release records',
       TRUE
  FROM scrolls_app
ON CONFLICT (key) DO UPDATE
  SET app_id = EXCLUDED.app_id,
      description = EXCLUDED.description,
      enabled = TRUE;

COMMIT;
