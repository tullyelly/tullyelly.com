CREATE OR REPLACE VIEW dojo.v_set_collector_header_snapshot AS
SELECT
  header.id AS set_collector_header_id,
  header.set_slug,
  header.set_name,
  header.release_year,
  header.manufacturer,
  header.tcdb_set_url,
  header.completed_set_photo_path,
  header.category_tag,
  header.rating,
  header.total_cards,
  header.created_at AS header_created_at,
  header.created_by AS header_created_by,
  header.updated_at AS header_updated_at,
  header.updated_by AS header_updated_by,
  snapshot.id AS set_collector_snapshot_id,
  snapshot.set_collector_header_id AS snapshot_set_collector_header_id,
  snapshot.snapshot_date,
  snapshot.cards_owned,
  snapshot.tcdb_trade_id,
  snapshot.created_at AS snapshot_created_at,
  snapshot.created_by AS snapshot_created_by,
  snapshot.updated_at AS snapshot_updated_at,
  snapshot.updated_by AS snapshot_updated_by
FROM dojo.set_collector_header AS header
LEFT JOIN dojo.set_collector_snapshot AS snapshot
  ON snapshot.set_collector_header_id = header.id;
