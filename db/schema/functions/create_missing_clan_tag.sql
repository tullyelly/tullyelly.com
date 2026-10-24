CREATE OR REPLACE FUNCTION dojo.create_missing_clan_tag(
  p_slug TEXT,
  p_clan_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_slug TEXT := NULLIF(btrim(p_slug), '');
BEGIN
  -- Use the required canonical clan slug for tag identity and routing.
  IF normalized_slug IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO dojo.tags (
    slug,
    name,
    display_name,
    href,
    href_kind,
    is_clickable
  )
  VALUES (
    normalized_slug,
    normalized_slug,
    lower(COALESCE(NULLIF(btrim(p_clan_name), ''), normalized_slug)),
    '/cardattack/clans/' || normalized_slug,
    'clan',
    TRUE
  )
  -- Preserve existing canonical routes, labels, metadata and audit fields.
  ON CONFLICT (slug) DO NOTHING;
  -- The existing tags BEFORE trigger infers group/CardAttack identity metadata.
END;
$$;
