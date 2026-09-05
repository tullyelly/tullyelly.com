CREATE TABLE IF NOT EXISTS dojo.tcdb_trade_partner (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tcdb_username TEXT NOT NULL,
  name TEXT,
  city_state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT tcdb_trade_partner_username_nonblank_check CHECK (NULLIF(BTRIM(tcdb_username), '') IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS tcdb_trade_partner_username_normalized_key ON dojo.tcdb_trade_partner (LOWER(BTRIM(tcdb_username)));
CREATE TRIGGER trg_audit_tcdb_trade_partner BEFORE INSERT OR UPDATE ON dojo.tcdb_trade_partner FOR EACH ROW EXECUTE PROCEDURE dojo.audit_stamp_generic();
