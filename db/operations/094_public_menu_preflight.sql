-- Read-only; save every result for the preservation comparison.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';

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
END
$coverage$;
SELECT current_database() AS database_name, current_user AS inspecting_role;
SELECT count(*) AS total, count(*) FILTER (WHERE kind = 'persona') AS roots,
       count(*) FILTER (WHERE kind = 'link') AS links FROM dojo.menu_node;
SELECT count(*) AS published_rows FROM dojo.v_menu_published;
SELECT * FROM dojo.schema_migration ORDER BY filename;
-- Save this JSON before execution and compare after; equality is required.
SELECT jsonb_agg(to_jsonb(m) ORDER BY id) AS unrelated_rows
FROM dojo.menu_node m WHERE href IS NULL OR href NOT IN ('/shaolin/tags', '/mark2/releases', '/cardattack/lcs', '/cardattack/usps', '/cardattack/releases', '/theabbott/releases', '/unclejimmy/squad/volleyball', '/unclejimmy/bricks', '/unclejimmy/call-a-save-point', '/unclejimmy/golden-age', '/unclejimmy/table-schema', '/unclejimmy/releases', '/stats', '/credits', '/tullyelly/releases', '/cardattack/homies', '/cardattack/clans', '/cardattack/categories', '/theabbott/crates', '/theabbott/homies', '/theabbott/clans', '/unclejimmy/fam', '/unclejimmy/squads');
SELECT jsonb_agg(to_jsonb(m) - ARRAY['feature_key','updated_at','updated_by'] ORDER BY id)
       AS repaired_rows_preserved_fields
FROM dojo.menu_node m WHERE href IN ('/cardattack/homies', '/cardattack/clans', '/cardattack/categories', '/theabbott/crates', '/theabbott/homies', '/theabbott/clans', '/unclejimmy/fam', '/unclejimmy/squads');
-- Save the complete menu too, to review the precise before/after diff.
SELECT * FROM dojo.menu_node ORDER BY id;
WITH expected AS (SELECT value AS item FROM jsonb_array_elements('[{"persona": "shaolin", "label": "Chronicle tags", "href": "/shaolin/tags", "order_index": 10, "prior": null}, {"persona": "mark2", "label": "Releases", "href": "/mark2/releases", "order_index": 90, "prior": null}, {"persona": "cardattack", "label": "Local Card Shops", "href": "/cardattack/lcs", "order_index": 70, "prior": null}, {"persona": "cardattack", "label": "USPS", "href": "/cardattack/usps", "order_index": 80, "prior": null}, {"persona": "cardattack", "label": "Releases", "href": "/cardattack/releases", "order_index": 90, "prior": null}, {"persona": "theabbott", "label": "Releases", "href": "/theabbott/releases", "order_index": 90, "prior": null}, {"persona": "unclejimmy", "label": "Volleyball Tournaments", "href": "/unclejimmy/squad/volleyball", "order_index": 30, "prior": null}, {"persona": "unclejimmy", "label": "Bricks: LEGO", "href": "/unclejimmy/bricks", "order_index": 40, "prior": null}, {"persona": "unclejimmy", "label": "Call A Save Point", "href": "/unclejimmy/call-a-save-point", "order_index": 50, "prior": null}, {"persona": "unclejimmy", "label": "Golden Age", "href": "/unclejimmy/golden-age", "order_index": 60, "prior": null}, {"persona": "unclejimmy", "label": "Table Schema", "href": "/unclejimmy/table-schema", "order_index": 70, "prior": null}, {"persona": "unclejimmy", "label": "Releases", "href": "/unclejimmy/releases", "order_index": 90, "prior": null}, {"persona": "tullyelly", "label": "Traffic statistics", "href": "/stats", "order_index": 30, "prior": null}, {"persona": "tullyelly", "label": "Flowers", "href": "/credits", "order_index": 40, "prior": null}, {"persona": "tullyelly", "label": "Releases", "href": "/tullyelly/releases", "order_index": 90, "prior": null}, {"persona": "cardattack", "href": "/cardattack/homies", "prior": "menu.cardattack.homies"}, {"persona": "cardattack", "href": "/cardattack/clans", "prior": "menu.cardattack.clans"}, {"persona": "cardattack", "href": "/cardattack/categories", "prior": "menu.cardattack.categories"}, {"persona": "theabbott", "href": "/theabbott/crates", "prior": "menu.theabbott.crates"}, {"persona": "theabbott", "href": "/theabbott/homies", "prior": "menu.theabbott.homies"}, {"persona": "theabbott", "href": "/theabbott/clans", "prior": "menu.theabbott.clans"}, {"persona": "unclejimmy", "href": "/unclejimmy/fam", "prior": "menu.unclejimmy.fam"}, {"persona": "unclejimmy", "href": "/unclejimmy/squads", "prior": "menu.unclejimmy.squads"}]'::jsonb))
SELECT count(*) FILTER (WHERE item->>'prior' IS NULL AND NOT EXISTS
         (SELECT 1 FROM dojo.menu_node WHERE href = item->>'href')) AS expected_inserts,
       count(*) FILTER (WHERE item->>'prior' IS NOT NULL AND EXISTS
         (SELECT 1 FROM dojo.menu_node WHERE href = item->>'href' AND feature_key = item->>'prior')) AS expected_updates
FROM expected;
COMMIT;
