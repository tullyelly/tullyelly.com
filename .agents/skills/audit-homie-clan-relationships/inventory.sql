-- Single read-only statement; export the inventory object, not its result wrapper.
SELECT jsonb_build_object(
  'database', current_database(), 'observedAt', statement_timestamp(),
  'homies', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',tag_slug) ORDER BY id),'[]') FROM dojo.homie),
  'clans', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug) ORDER BY id),'[]') FROM dojo.clan),
  'tags', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'slug',slug,'display_name',display_name,'href',href,'href_kind',href_kind,'meta',meta) ORDER BY id),'[]') FROM dojo.tags),
  'edges', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'source',source_tag_id,'target',target_tag_id,'type',relation_type,'meta',meta) ORDER BY id),'[]') FROM dojo.tag_relation)
) AS inventory;
