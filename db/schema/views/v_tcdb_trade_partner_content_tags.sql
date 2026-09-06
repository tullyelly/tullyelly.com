CREATE OR REPLACE VIEW dojo.v_tcdb_trade_partner_content_tags AS
SELECT link.trade_partner_id, tag.id AS tag_id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug) AS display_name,
  tag.href, tag.href_kind, 'homie'::TEXT AS source_type, link.homie_id AS source_id, NULL::TEXT AS tag_type
FROM dojo.tcdb_trade_partner_homie link JOIN dojo.homie homie ON homie.id = link.homie_id JOIN dojo.tags tag ON tag.slug = homie.tag_slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind, 'clan', link.clan_id, NULL::TEXT
FROM dojo.tcdb_trade_partner_clan link JOIN dojo.clan clan ON clan.id = link.clan_id JOIN dojo.tags tag ON tag.slug = clan.tag_slug
UNION ALL
SELECT link.trade_partner_id, tag.id, tag.slug, COALESCE(tag.display_name, tag.name, tag.slug), tag.href, tag.href_kind, 'tag', NULL::BIGINT, link.tag_type
FROM dojo.tcdb_trade_partner_tag link JOIN dojo.tags tag ON tag.id = link.tag_id;
