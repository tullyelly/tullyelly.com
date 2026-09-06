CREATE TABLE IF NOT EXISTS dojo.tcdb_trade_partner_tag (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES dojo.tags(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, tag_type, tag_id),
  CONSTRAINT tcdb_trade_partner_tag_type_check CHECK (tag_type ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
CREATE INDEX IF NOT EXISTS idx_tcdb_trade_partner_tag_tag ON dojo.tcdb_trade_partner_tag (tag_id, trade_partner_id);
