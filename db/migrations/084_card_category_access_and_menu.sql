-- Requires 083, authz foundation/revision functions, audit_log (066), and menu_node.
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM dojo.authz_app WHERE slug IN ('tcdb', 'menu')) <> 2 THEN
    RAISE EXCEPTION 'Expected tcdb and menu authorization apps';
  END IF;
END $$;
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT app.id, definition.key, definition.description, TRUE
FROM (VALUES
  ('tcdb', 'tcdb.category.snapshot.create', 'record an overall category card count'),
  ('tcdb', 'tcdb.category.snapshot.correct', 'correct an overall category card count'),
  ('menu', 'menu.cardattack.categories', 'Menu: Cardattack Categories')
) AS definition(app_slug, key, description)
JOIN dojo.authz_app AS app ON app.slug = definition.app_slug
ON CONFLICT (key) DO NOTHING;
-- Refuse scope drift rather than granting an existing feature under another app.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.authz_feature AS feature
    JOIN dojo.authz_app AS app ON app.id = feature.app_id
    WHERE (feature.key IN ('tcdb.category.snapshot.create', 'tcdb.category.snapshot.correct') AND app.slug <> 'tcdb')
       OR (feature.key = 'menu.cardattack.categories' AND app.slug <> 'menu')
  ) THEN RAISE EXCEPTION 'Category feature app scope differs from the reviewed definition'; END IF;
END $$;
-- Existing editor/admin roles only; preserve any explicit denies and disabled features.
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT role.id, feature.id, 'allow'
FROM dojo.authz_role AS role CROSS JOIN dojo.authz_feature AS feature
WHERE role.name IN ('editor', 'admin')
  AND feature.key IN ('tcdb.category.snapshot.create', 'tcdb.category.snapshot.correct')
ON CONFLICT (role_id, feature_id) DO NOTHING;
-- Match existing Clans menu access; public menu apps retain their usual public behavior.
INSERT INTO dojo.authz_role_feature (role_id, feature_id, effect)
SELECT existing.role_id, categories.id, existing.effect
FROM dojo.authz_role_feature AS existing
JOIN dojo.authz_feature AS clans ON clans.id = existing.feature_id
JOIN dojo.authz_feature AS categories ON categories.key = 'menu.cardattack.categories'
WHERE clans.key = 'menu.cardattack.clans'
ON CONFLICT (role_id, feature_id) DO NOTHING;
DO $$
DECLARE
  parent BIGINT;
  canonical BIGINT;
  affected UUID;
BEGIN
  SELECT id INTO parent FROM dojo.menu_node
  WHERE kind = 'persona' AND persona = 'cardattack' AND parent_id IS NULL
  ORDER BY id LIMIT 1;
  IF parent IS NULL THEN RAISE EXCEPTION 'Cardattack menu parent is missing'; END IF;
  SELECT id INTO canonical FROM dojo.menu_node
  WHERE feature_key = 'menu.cardattack.categories' OR href = '/cardattack/categories'
  ORDER BY CASE WHEN feature_key = 'menu.cardattack.categories' THEN 0 ELSE 1 END, id LIMIT 1;
  IF canonical IS NULL THEN
    INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta, published)
    VALUES (parent, 'cardattack', 'link', 'Categories', '/cardattack/categories',
      'menu.cardattack.categories', 27, '{}'::jsonb, TRUE) RETURNING id INTO canonical;
  ELSE
    UPDATE dojo.menu_node SET parent_id = parent, persona = 'cardattack', kind = 'link',
      label = 'Categories', href = '/cardattack/categories', feature_key = 'menu.cardattack.categories',
      order_index = 27, hidden = FALSE, published = TRUE,
      updated_at = CURRENT_TIMESTAMP, updated_by = CURRENT_USER WHERE id = canonical;
  END IF;
  UPDATE dojo.menu_node SET hidden = TRUE, published = FALSE,
    updated_at = CURRENT_TIMESTAMP, updated_by = CURRENT_USER
  WHERE id <> canonical AND (feature_key = 'menu.cardattack.categories' OR href = '/cardattack/categories');
  FOR affected IN
    SELECT DISTINCT membership.user_id FROM dojo.authz_user_app_role AS membership
    JOIN dojo.authz_role_feature AS grant_row ON grant_row.role_id = membership.role_id
    JOIN dojo.authz_feature AS feature ON feature.id = grant_row.feature_id
    WHERE feature.key IN ('tcdb.category.snapshot.create', 'tcdb.category.snapshot.correct', 'menu.cardattack.categories')
      AND (membership.app_id IS NULL OR membership.app_id = feature.app_id)
  LOOP
    PERFORM dojo.authz_bump_revision(affected);
    PERFORM pg_notify('authz_changed', affected::text);
  END LOOP;
END $$;
COMMIT;
