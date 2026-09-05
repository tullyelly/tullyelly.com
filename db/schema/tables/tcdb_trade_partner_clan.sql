CREATE TABLE IF NOT EXISTS dojo.tcdb_trade_partner_clan (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  clan_id BIGINT NOT NULL REFERENCES dojo.clan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, clan_id)
);
CREATE INDEX IF NOT EXISTS idx_tcdb_trade_partner_clan_clan ON dojo.tcdb_trade_partner_clan (clan_id, trade_partner_id);
