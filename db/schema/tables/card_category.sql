CREATE TABLE dojo.card_category (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100)
);
ALTER TABLE dojo.card_category OWNER TO tullyelly_admin;
CREATE TRIGGER trg_audit_card_category BEFORE INSERT OR UPDATE
  ON dojo.card_category FOR EACH ROW EXECUTE FUNCTION dojo.audit_stamp_generic();
