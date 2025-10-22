#!/usr/bin/env node

import "../lib/dns-polyfill.js";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.test", override: true });

if (process.env.SKIP_DB === "true") {
  console.log("[seed-e2e] SKIP_DB=true; skipping database seed.");
  process.exit(0);
}

const EFFECTIVE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? null;

if (!EFFECTIVE_URL) {
  console.error(
    "[seed-e2e] Missing TEST_DATABASE_URL or DATABASE_URL; cannot seed database.",
  );
  process.exit(1);
}

process.env.DATABASE_URL = EFFECTIVE_URL;

console.log("[seed-e2e] Using URL:", EFFECTIVE_URL);

function isDummyDatabase(url) {
  try {
    const parsed = new URL(url);
    const user = parsed.username?.toLowerCase();
    const host = parsed.hostname?.toLowerCase();
    const db = parsed.pathname?.slice(1)?.toLowerCase();
    return user === "dummy" && host === "127.0.0.1" && db === "dummy";
  } catch {
    return false;
  }
}

if (isDummyDatabase(EFFECTIVE_URL)) {
  console.log(
    "[seed-e2e] Dummy DATABASE_URL detected; skipping seed to avoid connection errors.",
  );
  process.exit(0);
}

function assertSafeUrl(url) {
  const parsed = new URL(url);
  const host = parsed.host.toLowerCase();
  const db = parsed.pathname.slice(1).toLowerCase();
  const user = parsed.username.toLowerCase();
  const prodish =
    host.includes("prod") ||
    host.includes("main") ||
    host.includes("vercel") ||
    db.includes("prod") ||
    user === "neondb_owner" ||
    db === "neondb";
  if (prodish && process.env.CI !== "true") {
    throw new Error(
      `[seed-e2e] Refusing to seed production-looking database (host=${host} db=${db} user=${user}).`,
    );
  }
}

assertSafeUrl(EFFECTIVE_URL);

const MENU_FEATURES = [
  ["menu.mark2.overview", "Menu: mark2 Overview"],
  ["menu.mark2.personas.about", "Menu: About the Personas"],
  ["menu.mark2.admin", "Menu: Admin"],
  ["menu.mark2.system.health", "Menu: System Health"],
  ["menu.mark2.scrolls", "Menu: Shaolin Scrolls"],
  ["menu.cardattack.overview", "Menu: cardattack Overview"],
  ["menu.cardattack.tcdb.home", "Menu: TCDB Home"],
  ["menu.cardattack.tcdb.rankings", "Menu: TCDB Rankings"],
  ["menu.theabbott.overview", "Menu: theabbott Overview"],
  ["menu.theabbott.hhe", "Menu: Heels Have Eyes"],
  ["menu.theabbott.roadwork", "Menu: Roadwork Rappin"],
  ["menu.unclejimmy.overview", "Menu: unclejimmy Overview"],
  ["menu.unclejimmy.cute", "Menu: Cute Cards"],
  ["menu.tullyelly.overview", "Menu: tullyelly Overview"],
  ["menu.tullyelly.docs", "Menu: Docs"],
];

const PERSONA_DEFS = [
  {
    persona: "mark2",
    label: "mark2",
    icon: "Brain",
    orderIndex: 10,
    children: [
      {
        label: "Overview",
        href: "/mark2",
        feature: "menu.mark2.overview",
        orderIndex: 0,
      },
      {
        label: "About the Personas",
        href: "/mark2/about-personas",
        feature: "menu.mark2.personas.about",
        orderIndex: 5,
      },
      {
        label: "Admin",
        href: "/mark2/admin",
        feature: "menu.mark2.admin",
        orderIndex: 10,
      },
      {
        label: "System Health",
        href: "/system/health",
        feature: "menu.mark2.system.health",
        orderIndex: 20,
      },
      {
        label: "Shaolin Scrolls",
        href: "/mark2/shaolin-scrolls",
        feature: "menu.mark2.scrolls",
        orderIndex: 30,
      },
    ],
  },
  {
    persona: "cardattack",
    label: "cardattack",
    icon: "GalleryHorizontalEnd",
    orderIndex: 20,
    children: [
      {
        label: "Overview",
        href: "/cardattack",
        feature: "menu.cardattack.overview",
        orderIndex: 0,
      },
      {
        label: "TCDB Home",
        href: "/tcdb",
        feature: "menu.cardattack.tcdb.home",
        orderIndex: 10,
      },
      {
        label: "Rankings",
        href: "/cardattack/tcdb-rankings",
        feature: "menu.cardattack.tcdb.rankings",
        orderIndex: 20,
      },
    ],
  },
  {
    persona: "theabbott",
    label: "theabbott",
    icon: "Feather",
    orderIndex: 30,
    children: [
      {
        label: "Overview",
        href: "/theabbott",
        feature: "menu.theabbott.overview",
        orderIndex: 0,
      },
      {
        label: "heels have eyes",
        href: "/theabbott/heels-have-eyes",
        feature: "menu.theabbott.hhe",
        orderIndex: 10,
        meta: { badge: { text: "NEW", tone: "new" } },
      },
      {
        label: "roadwork rappin",
        href: "/theabbott/roadwork-rappin",
        feature: "menu.theabbott.roadwork",
        orderIndex: 20,
      },
    ],
  },
  {
    persona: "unclejimmy",
    label: "unclejimmy",
    icon: "Smile",
    orderIndex: 40,
    children: [
      {
        label: "Overview",
        href: "/unclejimmy",
        feature: "menu.unclejimmy.overview",
        orderIndex: 0,
      },
      {
        label: "cute cards",
        href: "/unclejimmy/cute-cards",
        feature: "menu.unclejimmy.cute",
        orderIndex: 10,
      },
    ],
  },
  {
    persona: "tullyelly",
    label: "tullyelly",
    icon: "Code2",
    orderIndex: 50,
    children: [
      {
        label: "Overview",
        href: "/tullyelly",
        feature: "menu.tullyelly.overview",
        orderIndex: 0,
      },
      {
        label: "Docs",
        href: "/docs",
        feature: "menu.tullyelly.docs",
        orderIndex: 10,
      },
    ],
  },
];

async function ensureMenuApp(client) {
  await client.query(
    `
    INSERT INTO dojo.authz_app (slug, name, is_public)
    VALUES ('menu', 'Menu', TRUE)
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          is_public = EXCLUDED.is_public
  `,
  );

  const { rows } = await client.query(
    `SELECT id FROM dojo.authz_app WHERE slug = 'menu'`,
  );
  if (!rows.length) {
    throw new Error("[seed-e2e] Failed to resolve menu auth app id.");
  }
  return rows[0].id;
}

async function ensureMenuFeatures(client, appId) {
  for (const [key, description] of MENU_FEATURES) {
    await client.query(
      `
      INSERT INTO dojo.authz_feature (app_id, key, description, enabled)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (key) DO UPDATE
        SET app_id = EXCLUDED.app_id,
            description = EXCLUDED.description,
            enabled = TRUE
    `,
      [appId, key, description],
    );
  }
}

async function upsertPersonaNode(client, personaDef) {
  const { persona, label, icon, orderIndex } = personaDef;
  const existing = await client.query(
    `
    SELECT id
    FROM dojo.menu_node
    WHERE persona = $1
      AND kind = 'persona'
      AND parent_id IS NULL
    ORDER BY id
    LIMIT 1
  `,
    [persona],
  );

  if (existing.rows.length) {
    const id = existing.rows[0].id;
    await client.query(
      `
      UPDATE dojo.menu_node
         SET label = $1,
             icon = $2,
             order_index = $3,
             hidden = FALSE,
             published = TRUE
       WHERE id = $4
    `,
      [label, icon, orderIndex, id],
    );
    return id;
  }

  const inserted = await client.query(
    `
    INSERT INTO dojo.menu_node
      (parent_id, persona, kind, label, icon, order_index, hidden, meta, published)
    VALUES
      (NULL, $1, 'persona', $2, $3, $4, FALSE, '{}'::jsonb, TRUE)
    RETURNING id
  `,
    [persona, label, icon, orderIndex],
  );

  return inserted.rows[0].id;
}

async function upsertChildNode(client, parentId, persona, child) {
  const {
    label,
    href,
    feature,
    orderIndex,
    meta = {},
    target = null,
    icon = null,
  } = child;

  const metaJson = JSON.stringify(meta ?? {});

  const existing = feature
    ? await client.query(
        `SELECT id FROM dojo.menu_node WHERE feature_key = $1 LIMIT 1`,
        [feature],
      )
    : await client.query(
        `
        SELECT id
        FROM dojo.menu_node
        WHERE parent_id = $1
          AND label = $2
        ORDER BY id
        LIMIT 1
      `,
        [parentId, label],
      );

  if (existing.rows.length) {
    const id = existing.rows[0].id;
    await client.query(
      `
      UPDATE dojo.menu_node
         SET parent_id = $1,
             persona = $2,
             kind = 'link',
             label = $3,
             href = $4,
             target = $5,
             icon = $6,
             order_index = $7,
             feature_key = $8,
             hidden = FALSE,
             meta = $9::jsonb,
             published = TRUE
       WHERE id = $10
    `,
      [
        parentId,
        persona,
        label,
        href,
        target,
        icon,
        orderIndex,
        feature ?? null,
        metaJson,
        id,
      ],
    );
    return;
  }

  await client.query(
    `
    INSERT INTO dojo.menu_node
      (parent_id, persona, kind, label, href, target, icon, order_index, feature_key, hidden, meta, published)
    VALUES
      ($1, $2, 'link', $3, $4, $5, $6, $7, $8, FALSE, $9::jsonb, TRUE)
  `,
    [
      parentId,
      persona,
      label,
      href,
      target,
      icon,
      orderIndex,
      feature ?? null,
      metaJson,
    ],
  );
}

async function seedMenu(client) {
  const appId = await ensureMenuApp(client);
  await ensureMenuFeatures(client, appId);

  for (const personaDef of PERSONA_DEFS) {
    const personaId = await upsertPersonaNode(client, personaDef);
    for (const child of personaDef.children) {
      await upsertChildNode(
        client,
        personaId,
        personaDef.persona,
        child,
      );
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: EFFECTIVE_URL,
    ssl: EFFECTIVE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL search_path TO auth, dojo, public");

    await seedMenu(client);

    await client.query("COMMIT");
    console.log("[seed-e2e] Seed completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[seed-e2e] Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main();
