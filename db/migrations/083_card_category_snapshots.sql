-- Manual review/application only. Requires dojo.audit_stamp_generic and existing dojo owner role.
BEGIN;
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
CREATE TABLE dojo.card_category_snapshot (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES dojo.card_category(id),
  measured_on DATE NOT NULL CHECK (measured_on >= DATE '0100-01-01' AND measured_on <= DATE '9999-12-31' AND measured_on <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date),
  card_count INTEGER NOT NULL CHECK (card_count >= 0),
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
CREATE OR REPLACE VIEW dojo.v_card_category_snapshot AS
SELECT category.id AS category_id, category.slug, category.name,
  snapshot.id AS snapshot_id, snapshot.measured_on, snapshot.card_count,
  lag(snapshot.measured_on) OVER chronology AS previous_date,
  lag(snapshot.card_count) OVER chronology AS previous_count,
  snapshot.card_count - lag(snapshot.card_count) OVER chronology AS count_change
FROM dojo.card_category AS category
JOIN dojo.card_category_snapshot AS snapshot ON snapshot.category_id = category.id
WINDOW chronology AS (PARTITION BY category.id ORDER BY snapshot.measured_on);
ALTER VIEW dojo.v_card_category_snapshot OWNER TO tullyelly_admin;
CREATE OR REPLACE VIEW dojo.v_card_category_current AS
SELECT category.id AS category_id, category.slug, category.name,
  latest.snapshot_id, latest.measured_on, latest.card_count,
  latest.previous_date, latest.previous_count, latest.count_change
FROM dojo.card_category AS category
LEFT JOIN LATERAL (
  SELECT history.* FROM dojo.v_card_category_snapshot AS history
  WHERE history.category_id = category.id
  ORDER BY history.measured_on DESC LIMIT 1
) AS latest ON TRUE;
ALTER VIEW dojo.v_card_category_current OWNER TO tullyelly_admin;

-- Only confirmed category labels from the research baseline, also present in set headers.
-- Do not promote arbitrary theme tags or manufacture any measurements.
INSERT INTO dojo.card_category (slug, name)
SELECT labels.slug, labels.name FROM (VALUES
  ('baseball', 'Baseball'), ('basketball', 'Basketball'), ('boxing', 'Boxing'),
  ('football', 'Football'), ('gaming', 'Gaming'), ('golf', 'Golf'),
  ('hockey', 'Hockey'), ('multi-sport', 'Multi-sport'), ('non-sport', 'Non-sport')
) AS labels(slug, name)
WHERE EXISTS (SELECT 1 FROM dojo.set_collector_header AS header
  WHERE lower(btrim(header.category_tag)) = labels.slug)
ON CONFLICT (slug) DO NOTHING;
COMMIT;
