CREATE TABLE IF NOT EXISTS dojo.tcdb_trade_partner_homie (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  homie_id BIGINT NOT NULL REFERENCES dojo.homie(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, homie_id)
);
CREATE INDEX IF NOT EXISTS idx_tcdb_trade_partner_homie_homie ON dojo.tcdb_trade_partner_homie (homie_id, trade_partner_id);
