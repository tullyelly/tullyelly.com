CREATE OR REPLACE FUNCTION audit_stamp_generic() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := CURRENT_TIMESTAMP; END IF;
    IF NEW.created_by IS NULL THEN NEW.created_by := CURRENT_USER; END IF;
    NEW.updated_at := NULL;
    NEW.updated_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
    NEW.updated_by := CURRENT_USER;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION audit_stamp_generic() OWNER TO tullyelly_admin;