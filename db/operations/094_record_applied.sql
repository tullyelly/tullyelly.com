-- James-only ledger reconciliation AFTER confirmed successful execution of the exact 094 file.
-- Never run for a failed/rolled-back attempt or infer exact execution from installed state alone.
-- Verify migration SHA-256 and saved execution evidence first; development before approved production.
-- If the atomic bundle already recorded this row, a matching valid row is left unchanged.
-- Reconciliation timestamps are current; original execution duration is unknown.
-- On failure, ROLLBACK the session before any retry.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(hashtext('cipher:schema-migrations'));
LOCK TABLE dojo.schema_migration IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE dojo.menu_node IN SHARE MODE;

DO $coverage$
DECLARE
  expected CONSTANT jsonb := $manifest$[
  {
    "persona": "shaolin",
    "label": "Chronicle tags",
    "href": "/shaolin/tags",
    "order_index": 10,
    "prior": null
  },
  {
    "persona": "mark2",
    "label": "Releases",
    "href": "/mark2/releases",
    "order_index": 90,
    "prior": null
  },
  {
    "persona": "cardattack",
    "label": "Local Card Shops",
    "href": "/cardattack/lcs",
    "order_index": 70,
    "prior": null
  },
  {
    "persona": "cardattack",
    "label": "USPS",
    "href": "/cardattack/usps",
    "order_index": 80,
    "prior": null
  },
  {
    "persona": "cardattack",
    "label": "Releases",
    "href": "/cardattack/releases",
    "order_index": 90,
    "prior": null
  },
  {
    "persona": "theabbott",
    "label": "Releases",
    "href": "/theabbott/releases",
    "order_index": 90,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Volleyball Tournaments",
    "href": "/unclejimmy/squad/volleyball",
    "order_index": 30,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Bricks: LEGO",
    "href": "/unclejimmy/bricks",
    "order_index": 40,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Call A Save Point",
    "href": "/unclejimmy/call-a-save-point",
    "order_index": 50,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Golden Age",
    "href": "/unclejimmy/golden-age",
    "order_index": 60,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Table Schema",
    "href": "/unclejimmy/table-schema",
    "order_index": 70,
    "prior": null
  },
  {
    "persona": "unclejimmy",
    "label": "Releases",
    "href": "/unclejimmy/releases",
    "order_index": 90,
    "prior": null
  },
  {
    "persona": "tullyelly",
    "label": "Traffic statistics",
    "href": "/stats",
    "order_index": 30,
    "prior": null
  },
  {
    "persona": "tullyelly",
    "label": "Flowers",
    "href": "/credits",
    "order_index": 40,
    "prior": null
  },
  {
    "persona": "tullyelly",
    "label": "Releases",
    "href": "/tullyelly/releases",
    "order_index": 90,
    "prior": null
  },
  {
    "persona": "cardattack",
    "href": "/cardattack/homies",
    "prior": "menu.cardattack.homies"
  },
  {
    "persona": "cardattack",
    "href": "/cardattack/clans",
    "prior": "menu.cardattack.clans"
  },
  {
    "persona": "cardattack",
    "href": "/cardattack/categories",
    "prior": "menu.cardattack.categories"
  },
  {
    "persona": "theabbott",
    "href": "/theabbott/crates",
    "prior": "menu.theabbott.crates"
  },
  {
    "persona": "theabbott",
    "href": "/theabbott/homies",
    "prior": "menu.theabbott.homies"
  },
  {
    "persona": "theabbott",
    "href": "/theabbott/clans",
    "prior": "menu.theabbott.clans"
  },
  {
    "persona": "unclejimmy",
    "href": "/unclejimmy/fam",
    "prior": "menu.unclejimmy.fam"
  },
  {
    "persona": "unclejimmy",
    "href": "/unclejimmy/squads",
    "prior": "menu.unclejimmy.squads"
  }
]$manifest$::jsonb;
  item jsonb;
  root dojo.menu_node%ROWTYPE;
  node dojo.menu_node%ROWTYPE;
  matches integer;
BEGIN
  -- Validate the complete plan before any writes. Count globally, never LIMIT 1.
  FOR item IN SELECT value FROM jsonb_array_elements(expected) LOOP
    SELECT count(*) INTO matches FROM dojo.menu_node
    WHERE persona = item->>'persona' AND kind = 'persona' AND parent_id IS NULL;
    IF matches <> 1 THEN
      RAISE EXCEPTION 'Expected exactly one persona root: %', item->>'persona';
    END IF;
    SELECT * INTO STRICT root FROM dojo.menu_node
    WHERE persona = item->>'persona' AND kind = 'persona' AND parent_id IS NULL;
    IF root.hidden OR NOT root.published OR root.feature_key IS NOT NULL
       OR (root.meta ? 'requires' AND root.meta->'requires' <> '[]'::jsonb) THEN
      RAISE EXCEPTION 'Root is not public: %', root.persona;
    END IF;
    SELECT count(*) INTO matches FROM dojo.menu_node
    WHERE href = item->>'href'
       OR (item->>'prior' IS NOT NULL AND feature_key = item->>'prior');
    IF matches > 1 OR (item->>'prior' IS NOT NULL AND matches <> 1) THEN
      RAISE EXCEPTION 'Ambiguous or missing destination: %', item->>'href';
    END IF;
    IF matches = 1 THEN
      SELECT * INTO STRICT node FROM dojo.menu_node
      WHERE href = item->>'href'
         OR (item->>'prior' IS NOT NULL AND feature_key = item->>'prior');
      IF node.href IS DISTINCT FROM item->>'href'
         OR node.persona IS DISTINCT FROM item->>'persona'
         OR node.parent_id IS DISTINCT FROM root.id OR node.kind <> 'link'
         OR node.hidden OR NOT node.published
         OR (node.meta ? 'requires' AND node.meta->'requires' <> '[]'::jsonb)
         OR (node.feature_key IS NOT NULL AND node.feature_key IS DISTINCT FROM item->>'prior') THEN
        RAISE EXCEPTION 'Conflicting identity, restriction or suppressed target: %', item->>'href';
      END IF;
      IF item->>'prior' IS NULL AND (
           node.label IS DISTINCT FROM item->>'label'
           OR node.order_index IS DISTINCT FROM (item->>'order_index')::integer
           OR node.target IS NOT NULL OR node.feature_key IS NOT NULL) THEN
        RAISE EXCEPTION 'Existing addition differs from reviewed state: %', item->>'href';
      END IF;
    END IF;
    IF item->>'prior' IS NULL AND EXISTS (
      SELECT 1 FROM dojo.menu_node
      WHERE parent_id = root.id AND order_index = (item->>'order_index')::integer
        AND href IS DISTINCT FROM item->>'href'
    ) THEN
      RAISE EXCEPTION 'Sibling order collision: %', item->>'href';
    END IF;
  END LOOP;
  FOR item IN SELECT value FROM jsonb_array_elements(expected) LOOP
    IF NOT EXISTS (SELECT 1 FROM dojo.v_menu_published
                   WHERE href = item->>'href' AND feature_key IS NULL AND NOT hidden) THEN
      RAISE EXCEPTION 'Public destination missing from published view: %', item->>'href';
    END IF;
  END LOOP;
END
$coverage$;

DO $ledger$
BEGIN
  IF EXISTS (SELECT 1 FROM dojo.schema_migration
             WHERE filename LIKE '094%' AND filename <> '094_complete_public_menu_coverage.sql') THEN
    RAISE EXCEPTION 'Migration number 094 is occupied';
  END IF;
  IF EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '094_complete_public_menu_coverage.sql'
             AND (checksum IS DISTINCT FROM 'f667053fcf6bf53f5ab25c2661c63052d1fefc22932de8f6818f0372a2bb7e0b' OR checksum_algorithm IS DISTINCT FROM 'sha256'
                  OR status IS DISTINCT FROM 'applied' OR applied_at IS NULL OR error_message IS NOT NULL)) THEN
    RAISE EXCEPTION 'Existing 094 ledger entry conflicts; review separately';
  END IF;
  INSERT INTO dojo.schema_migration
    (filename, checksum, checksum_algorithm, status, applied_at, attempted_at, execution_ms, error_message)
  SELECT '094_complete_public_menu_coverage.sql', 'f667053fcf6bf53f5ab25c2661c63052d1fefc22932de8f6818f0372a2bb7e0b', 'sha256', 'applied', now(), now(), NULL, NULL
  WHERE NOT EXISTS (SELECT 1 FROM dojo.schema_migration WHERE filename = '094_complete_public_menu_coverage.sql');
END
$ledger$;
COMMIT;
