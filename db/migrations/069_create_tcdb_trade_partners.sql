-- 069_create_tcdb_trade_partners.sql
-- Promote TCDb trade partners to relational identities and normalized interests.

SET search_path = dojo, auth, public;

BEGIN;

CREATE TABLE dojo.tcdb_trade_partner (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tcdb_username TEXT NOT NULL,
  name TEXT,
  city_state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(100),
  CONSTRAINT tcdb_trade_partner_username_nonblank_check
    CHECK (NULLIF(BTRIM(tcdb_username), '') IS NOT NULL)
);

CREATE UNIQUE INDEX tcdb_trade_partner_username_normalized_key
  ON dojo.tcdb_trade_partner (LOWER(BTRIM(tcdb_username)));

CREATE TABLE dojo.tcdb_trade_partner_homie (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  homie_id BIGINT NOT NULL REFERENCES dojo.homie(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, homie_id)
);

CREATE INDEX idx_tcdb_trade_partner_homie_homie
  ON dojo.tcdb_trade_partner_homie (homie_id, trade_partner_id);

CREATE TABLE dojo.tcdb_trade_partner_clan (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  clan_id BIGINT NOT NULL REFERENCES dojo.clan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, clan_id)
);

CREATE INDEX idx_tcdb_trade_partner_clan_clan
  ON dojo.tcdb_trade_partner_clan (clan_id, trade_partner_id);

CREATE TABLE dojo.tcdb_trade_partner_tag (
  trade_partner_id BIGINT NOT NULL REFERENCES dojo.tcdb_trade_partner(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES dojo.tags(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT CURRENT_USER,
  PRIMARY KEY (trade_partner_id, tag_type, tag_id),
  CONSTRAINT tcdb_trade_partner_tag_type_check
    CHECK (tag_type ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX idx_tcdb_trade_partner_tag_tag
  ON dojo.tcdb_trade_partner_tag (tag_id, trade_partner_id);

DROP TRIGGER IF EXISTS trg_audit_tcdb_trade_partner ON dojo.tcdb_trade_partner;
CREATE TRIGGER trg_audit_tcdb_trade_partner
BEFORE INSERT OR UPDATE ON dojo.tcdb_trade_partner
FOR EACH ROW EXECUTE FUNCTION dojo.audit_stamp_generic();

INSERT INTO dojo.tcdb_trade_partner (tcdb_username)
SELECT DISTINCT ON (LOWER(BTRIM(trade.partner))) BTRIM(trade.partner)
FROM dojo.tcdb_trade AS trade
WHERE NULLIF(BTRIM(trade.partner), '') IS NOT NULL
ORDER BY LOWER(BTRIM(trade.partner)), trade.id
ON CONFLICT DO NOTHING;

ALTER TABLE dojo.tcdb_trade ADD COLUMN trade_partner_id BIGINT;

UPDATE dojo.tcdb_trade AS trade
SET trade_partner_id = partner.id
FROM dojo.tcdb_trade_partner AS partner
WHERE LOWER(BTRIM(trade.partner)) = LOWER(BTRIM(partner.tcdb_username));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dojo.tcdb_trade
    WHERE NULLIF(BTRIM(partner), '') IS NOT NULL AND trade_partner_id IS NULL
  ) THEN
    RAISE EXCEPTION 'TCDb trade partner backfill left nonblank partner values unmapped';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.tcdb_trade WHERE trade_partner_id IS NULL) THEN
    RAISE EXCEPTION 'TCDb trade partner normalization found partnerless trades';
  END IF;
END;
$$;

ALTER TABLE dojo.tcdb_trade
  ALTER COLUMN trade_partner_id SET NOT NULL,
  ADD CONSTRAINT tcdb_trade_trade_partner_id_fkey
    FOREIGN KEY (trade_partner_id) REFERENCES dojo.tcdb_trade_partner(id);

CREATE INDEX idx_tcdb_trade_trade_partner
  ON dojo.tcdb_trade (trade_partner_id, trade_id);

CREATE TEMP TABLE tcdb_trade_partner_validation ON COMMIT DROP AS
SELECT
  (SELECT COUNT(*) FROM dojo.tcdb_trade) AS trade_count,
  (SELECT COALESCE(SUM(sent), 0) FROM dojo.tcdb_trade) AS cards_sent,
  (SELECT COALESCE(SUM(received), 0) FROM dojo.tcdb_trade) AS cards_received,
  (SELECT COUNT(*) FROM dojo.v_tcdb_trade_hall_of_fame_induction) AS induction_count;

DROP VIEW IF EXISTS dojo.v_tcdb_trade_hall_of_famer;
DROP VIEW IF EXISTS dojo.v_tcdb_trade_hall_of_fame_induction;

CREATE OR REPLACE VIEW dojo.v_shaolin_site_activity AS
SELECT day.trade_date AS activity_date, 'tcdb_trade'::text AS activity_type,
  day.side::text AS activity_subtype, trade.trade_id::text AS source_id,
  partner.tcdb_username::text AS title,
  CASE WHEN day.side = 'sent' THEN trade.sent ELSE trade.received END::bigint AS activity_value,
  ('/cardattack/tcdb-trades/' || trade.trade_id)::text AS destination_path,
  jsonb_strip_nulls(jsonb_build_object('tradePartnerId', partner.id,
    'tcdbUsername', partner.tcdb_username, 'sent', trade.sent, 'received', trade.received)) AS metadata
FROM dojo.tcdb_trade_day day
JOIN dojo.tcdb_trade trade ON trade.trade_id = day.trade_id
JOIN dojo.tcdb_trade_partner partner ON partner.id = trade.trade_partner_id
WHERE day.side IN ('sent', 'received')
UNION ALL
SELECT day.visit_date, 'lcs_visit', NULL, header.lcs_slug, header.lcs_name, NULL,
  '/cardattack/lcs/' || header.lcs_slug,
  jsonb_strip_nulls(jsonb_build_object('city', header.city, 'state', header.state, 'rating', header.rating))
FROM dojo.lcs_day day JOIN dojo.lcs_header header ON header.id = day.lcs_header_id
UNION ALL
SELECT day.visit_date, 'usps_visit', NULL, header.city_slug, header.city_name, NULL,
  '/cardattack/usps/' || header.city_slug,
  jsonb_build_object('state', header.state, 'rating', header.rating)
FROM dojo.usps_day day JOIN dojo.usps_header header ON header.id = day.usps_header_id
UNION ALL
SELECT reference.post_date, 'review', review_type.slug, subject.external_id,
  COALESCE(subject.name, reference.post_title), reference.rating_numeric, reference.post_url,
  jsonb_strip_nulls(jsonb_build_object('reviewType', review_type.label,
    'rating', reference.rating_raw, 'chronicleTitle', reference.post_title))
FROM dojo.review_reference reference
JOIN dojo.review_subject subject ON subject.id = reference.review_subject_id
JOIN dojo.review_type review_type ON review_type.id = subject.review_type_id
UNION ALL
SELECT day.build_date, 'bricks_build', header.subset, header.lego_id, header.set_name,
  NULL, '/unclejimmy/bricks/' || header.lego_id,
  jsonb_strip_nulls(jsonb_build_object('bags', day.bags, 'pieces', header.piece_count))
FROM dojo.bricks_day day JOIN dojo.bricks_header header ON header.id = day.bricks_header_id
UNION ALL
SELECT snapshot.snapshot_date, 'set_collector', NULL, header.set_slug, header.set_name,
  snapshot.cards_owned, '/cardattack/set-collector/' || header.set_slug,
  jsonb_strip_nulls(jsonb_build_object('cardsOwned', snapshot.cards_owned,
    'totalCards', header.total_cards, 'tradeId', snapshot.tcdb_trade_id))
FROM dojo.set_collector_snapshot snapshot
JOIN dojo.set_collector_header header ON header.id = snapshot.set_collector_header_id;

ALTER TABLE dojo.tcdb_trade DROP COLUMN partner;

CREATE VIEW dojo.v_tcdb_trade_hall_of_fame_induction AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (collector.set_collector_header_id)
    collector.set_collector_header_id, collector.set_slug, collector.set_name,
    collector.release_year, collector.manufacturer, collector.category_tag,
    collector.snapshot_date, collector.cards_owned, collector.total_cards,
    collector.tcdb_trade_id
  FROM dojo.v_set_collector_header_snapshot AS collector
  WHERE collector.set_collector_snapshot_id IS NOT NULL
  ORDER BY collector.set_collector_header_id, collector.snapshot_date DESC,
    collector.set_collector_snapshot_id DESC
)
SELECT
  latest.set_collector_header_id, latest.set_slug, latest.set_name,
  latest.release_year, latest.manufacturer,
  NULLIF(BTRIM(latest.category_tag), '') AS category_tag,
  trade.trade_id, partner.id AS trade_partner_id,
  partner.tcdb_username, partner.name,
  COALESCE(MAX(day.trade_date) FILTER (WHERE day.side IN ('received', 'archived')),
    latest.snapshot_date) AS inducted_date,
  latest.cards_owned, latest.total_cards
FROM latest_snapshot AS latest
JOIN dojo.tcdb_trade AS trade ON trade.trade_id = latest.tcdb_trade_id
JOIN dojo.tcdb_trade_partner AS partner ON partner.id = trade.trade_partner_id
LEFT JOIN dojo.tcdb_trade_day AS day ON day.trade_id = trade.trade_id
WHERE latest.cards_owned = latest.total_cards
GROUP BY latest.set_collector_header_id, latest.set_slug, latest.set_name,
  latest.release_year, latest.manufacturer, NULLIF(BTRIM(latest.category_tag), ''),
  trade.trade_id, partner.id, partner.tcdb_username, partner.name,
  latest.snapshot_date, latest.cards_owned, latest.total_cards;

CREATE VIEW dojo.v_tcdb_trade_hall_of_famer AS
SELECT induction.trade_partner_id, induction.tcdb_username, induction.name,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT induction.category_tag ORDER BY induction.category_tag), NULL::TEXT) AS category_tags,
  COUNT(*) AS induction_count, MAX(induction.inducted_date) AS latest_inducted_date
FROM dojo.v_tcdb_trade_hall_of_fame_induction AS induction
GROUP BY induction.trade_partner_id, induction.tcdb_username, induction.name;

CREATE VIEW dojo.v_tcdb_trade_partner_summary AS
WITH trade_rollup AS (
  SELECT trade.trade_partner_id, COUNT(*) AS trade_count,
    COALESCE(SUM(trade.sent), 0) AS cards_sent,
    COALESCE(SUM(trade.received), 0) AS cards_received
  FROM dojo.tcdb_trade AS trade
  GROUP BY trade.trade_partner_id
), trade_dates AS (
  SELECT trade.trade_partner_id, MIN(day.trade_date) AS first_trade_date,
    MAX(day.trade_date) AS latest_trade_date
  FROM dojo.tcdb_trade AS trade
  JOIN dojo.tcdb_trade_day AS day ON day.trade_id = trade.trade_id
  GROUP BY trade.trade_partner_id
), hof AS (
  SELECT trade_partner_id, COUNT(*) AS hall_of_fame_count
  FROM dojo.v_tcdb_trade_hall_of_fame_induction GROUP BY trade_partner_id
)
SELECT partner.id AS trade_partner_id, partner.tcdb_username, partner.name,
  partner.city_state, partner.country, COALESCE(trade_rollup.trade_count, 0) AS trade_count,
  COALESCE(trade_rollup.cards_sent, 0) AS cards_sent,
  COALESCE(trade_rollup.cards_received, 0) AS cards_received,
  COALESCE(trade_rollup.cards_sent, 0) + COALESCE(trade_rollup.cards_received, 0) AS total_cards_exchanged,
  trade_dates.first_trade_date, trade_dates.latest_trade_date,
  COALESCE(hof.hall_of_fame_count, 0) AS hall_of_fame_count
FROM dojo.tcdb_trade_partner AS partner
LEFT JOIN trade_rollup ON trade_rollup.trade_partner_id = partner.id
LEFT JOIN trade_dates ON trade_dates.trade_partner_id = partner.id
LEFT JOIN hof ON hof.trade_partner_id = partner.id;

CREATE VIEW dojo.v_tcdb_trade_partner_content_tags AS
SELECT link.trade_partner_id, tag.id AS tag_id, tag.slug,
  COALESCE(tag.display_name, tag.name, tag.slug) AS display_name,
  tag.href, tag.href_kind, 'homie'::TEXT AS source_type, link.homie_id AS source_id,
  NULL::TEXT AS tag_type
FROM dojo.tcdb_trade_partner_homie AS link
JOIN dojo.homie AS homie ON homie.id = link.homie_id
JOIN dojo.tags AS tag ON tag.slug = homie.tag_slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug,
  COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind,
  'clan', link.clan_id, NULL::TEXT
FROM dojo.tcdb_trade_partner_clan AS link
JOIN dojo.clan AS clan ON clan.id = link.clan_id
JOIN dojo.tags AS tag ON tag.slug = clan.tag_slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug,
  COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind,
  'tag', NULL::BIGINT, link.tag_type
FROM dojo.tcdb_trade_partner_tag AS link
JOIN dojo.tags AS tag ON tag.id = link.tag_id;

COMMENT ON VIEW dojo.v_tcdb_trade_partner_content_tags IS
  'Canonical content tags derived only from explicit partner homie, clan, and typed-tag relationships.';

DO $$
DECLARE expected tcdb_trade_partner_validation%ROWTYPE;
BEGIN
  SELECT * INTO expected FROM tcdb_trade_partner_validation;
  IF (SELECT COALESCE(SUM(trade_count), 0) FROM dojo.v_tcdb_trade_partner_summary) <> expected.trade_count
    OR (SELECT COALESCE(SUM(cards_sent), 0) FROM dojo.v_tcdb_trade_partner_summary) <> expected.cards_sent
    OR (SELECT COALESCE(SUM(cards_received), 0) FROM dojo.v_tcdb_trade_partner_summary) <> expected.cards_received THEN
    RAISE EXCEPTION 'TCDb trade partner summary changed trade/card totals';
  END IF;
  IF (SELECT COUNT(*) FROM dojo.v_tcdb_trade_hall_of_fame_induction) <> expected.induction_count THEN
    RAISE EXCEPTION 'TCDb Hall of Fame induction count changed during normalization';
  END IF;
  IF EXISTS (
    SELECT LOWER(BTRIM(tcdb_username)) FROM dojo.tcdb_trade_partner
    GROUP BY LOWER(BTRIM(tcdb_username)) HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate normalized TCDb usernames remain';
  END IF;
END;
$$;

WITH menu_app AS (SELECT id FROM dojo.authz_app WHERE slug = 'menu')
INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
SELECT id, 'menu.cardattack.tcdb.trade.partners', 'Menu: TCDb Trade Partners', TRUE FROM menu_app
ON CONFLICT (key) DO UPDATE SET enabled = TRUE, description = EXCLUDED.description;

INSERT INTO dojo.menu_node (parent_id, persona, kind, label, href, feature_key, order_index, meta)
SELECT parent.id, 'cardattack', 'link', 'Trade Partners', '/cardattack/tcdb-trade-partners', NULL, 40, '{}'::jsonb
FROM dojo.menu_node AS parent
WHERE parent.kind = 'persona' AND parent.persona = 'cardattack'
  AND NOT EXISTS (SELECT 1 FROM dojo.menu_node WHERE href = '/cardattack/tcdb-trade-partners');

UPDATE dojo.menu_node SET order_index = 50, updated_at = now(), updated_by = CURRENT_USER
WHERE href = '/cardattack/hof';
UPDATE dojo.menu_node SET order_index = 60, updated_at = now(), updated_by = CURRENT_USER
WHERE href = '/cardattack/set-collector';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT ON dojo.tcdb_trade_partner, dojo.tcdb_trade_partner_homie,
      dojo.tcdb_trade_partner_clan, dojo.tcdb_trade_partner_tag,
      dojo.v_tcdb_trade_partner_summary, dojo.v_tcdb_trade_partner_content_tags,
      dojo.v_tcdb_trade_hall_of_fame_induction, dojo.v_tcdb_trade_hall_of_famer TO app_user;
  END IF;
END;
$$;

COMMIT;
