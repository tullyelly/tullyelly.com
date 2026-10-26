CREATE TABLE dojo.card_category_snapshot (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES dojo.card_category(id),
  measured_on DATE NOT NULL CHECK (measured_on >= DATE '0100-01-01' AND measured_on <= DATE '9999-12-31' AND measured_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date),
  card_count INTEGER NOT NULL CHECK (card_count >= 0),
  difference INTEGER,
  ranking INTEGER CONSTRAINT card_category_snapshot_ranking_check CHECK (ranking >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT card_category_snapshot_category_date_key UNIQUE (category_id, measured_on)
);
COMMENT ON COLUMN dojo.card_category_snapshot.card_count IS
  'Independently recorded overall owned-card count for this category and day; no unique-card or duplicate convention is asserted.';
ALTER TABLE dojo.card_category_snapshot OWNER TO tullyelly_admin;
CREATE TRIGGER trg_audit_card_category_snapshot BEFORE INSERT OR UPDATE
  ON dojo.card_category_snapshot FOR EACH ROW EXECUTE FUNCTION dojo.audit_stamp_generic();
