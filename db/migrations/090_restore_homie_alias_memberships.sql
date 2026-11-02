-- 090_restore_homie_alias_memberships.sql
-- Production compared read-only on 2026-11-01. Manual execution only.
-- Requires existing tag identities and migrations through 089; no identities are renamed.
-- Run development first, then approved production. After failure, ROLLBACK
-- in that session before rerunning this complete transaction.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE dojo.homie, dojo.clan, dojo.tags IN SHARE MODE;
LOCK TABLE dojo.tag_relation IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE homie_alias_membership_seed (
  homie_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  legacy_slug TEXT NOT NULL,
  clan_slug TEXT NOT NULL,
  PRIMARY KEY (source_slug, clan_slug)
) ON COMMIT DROP;

INSERT INTO homie_alias_membership_seed
  (homie_name, source_slug, legacy_slug, clan_slug) VALUES
  ('Dennis Rodman', 'the-worm', 'dennis-rodman', 'purple-and-gold'),
  ('Desmond Mason', 'desmond', 'desmond-mason', 'bucks-n-six'),
  ('Dikembe Mutombo', 'dikembe', 'dikembe-mutombo', 'rockets'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'blazers'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'heat-culture'),
  ('Juwan Howard', 'juwan', 'juwan-howard', 'rockets'),
  ('Pau Gasol', 'pau', 'pau-gasol', 'bucks-n-six'),
  ('Pau Gasol', 'pau', 'pau-gasol', 'purple-and-gold'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'blazers'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'bucks-n-six'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'golden-eagles'),
  ('Wes Matthews', 'wes', 'wes-matthews', 'purple-and-gold');

DO $check$
DECLARE
  endpoint_problems TEXT;
BEGIN
  SELECT string_agg(seed.source_slug || ' -> ' || seed.clan_slug, E'\n'
    ORDER BY seed.source_slug, seed.clan_slug) INTO endpoint_problems
  FROM homie_alias_membership_seed AS seed
  LEFT JOIN dojo.homie AS homie
    ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
  LEFT JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
  LEFT JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
  LEFT JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
  LEFT JOIN dojo.tags AS legacy_tag ON legacy_tag.slug = seed.legacy_slug
  LEFT JOIN dojo.tag_relation AS legacy_relation
    ON legacy_relation.source_tag_id = legacy_tag.id
    AND legacy_relation.target_tag_id = target_tag.id
    AND legacy_relation.relation_type = 'member_of'
  WHERE homie.id IS NULL OR source_tag.id IS NULL OR target_tag.id IS NULL
    OR source_tag.id = target_tag.id
    OR (SELECT count(*) FROM dojo.homie AS candidate
        WHERE candidate.tag_slug = seed.source_slug) <> 1
    OR source_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'person'
    OR source_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'homie'
    OR target_tag.meta #>> '{identity,kind}' IS DISTINCT FROM 'group'
    OR target_tag.meta #>> '{identity,contexts,cardattack,role}' IS DISTINCT FROM 'clan'
    OR legacy_relation.id IS NULL
    OR legacy_relation.meta->>'membership_basis' IS DISTINCT FROM 'played_for'
    OR NULLIF(legacy_relation.meta->>'evidence_url', '') IS NULL;

  IF endpoint_problems IS NOT NULL THEN
    RAISE EXCEPTION 'reviewed membership endpoints or evidence missing or changed; transaction aborted'
      USING DETAIL = endpoint_problems,
            HINT = 'Review identities and prerequisites, then ROLLBACK and rerun the complete file.';
  END IF;
END;
$check$;

INSERT INTO dojo.tag_relation (source_tag_id, target_tag_id, relation_type, meta)
SELECT source_tag.id, target_tag.id, 'member_of', legacy_relation.meta || jsonb_build_object(
  'migration', '090_restore_homie_alias_memberships',
  'reviewed_on', '2026-11-01',
  'copied_from_slug', seed.legacy_slug,
  'copied_from_migration', legacy_relation.meta->>'migration'
)
FROM homie_alias_membership_seed AS seed
JOIN dojo.homie AS homie
  ON homie.name = seed.homie_name AND homie.tag_slug = seed.source_slug
JOIN dojo.tags AS source_tag ON source_tag.slug = homie.tag_slug
JOIN dojo.clan AS clan ON clan.slug = seed.clan_slug
JOIN dojo.tags AS target_tag ON target_tag.slug = clan.slug
JOIN dojo.tags AS legacy_tag ON legacy_tag.slug = seed.legacy_slug
JOIN dojo.tag_relation AS legacy_relation
  ON legacy_relation.source_tag_id = legacy_tag.id
  AND legacy_relation.target_tag_id = target_tag.id
  AND legacy_relation.relation_type = 'member_of'
ON CONFLICT (source_tag_id, relation_type, target_tag_id) DO NOTHING;

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM homie_alias_membership_seed AS seed
    JOIN dojo.tags AS source_tag ON source_tag.slug = seed.source_slug
    JOIN dojo.tags AS target_tag ON target_tag.slug = seed.clan_slug
    LEFT JOIN dojo.tag_relation AS relation
      ON relation.source_tag_id = source_tag.id
      AND relation.target_tag_id = target_tag.id
      AND relation.relation_type = 'member_of'
    WHERE relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'a reviewed membership was not inserted; transaction aborted';
  END IF;
END;
$check$;

COMMIT;
