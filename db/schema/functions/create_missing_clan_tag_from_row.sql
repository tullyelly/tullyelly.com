CREATE OR REPLACE FUNCTION dojo.create_missing_clan_tag_from_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM dojo.create_missing_clan_tag(NEW.slug, NEW.name);
  RETURN NEW;
END;
$$;
