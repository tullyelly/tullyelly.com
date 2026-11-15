import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Offline only: evidence establishes candidate membership, never name guessing.
export function audit(inventory, reviewed, filters = {}) {
  for (const key of ["homies", "clans", "tags", "edges"])
    if (!Array.isArray(inventory[key]))
      throw new Error(`Missing inventory ${key}`);
  if (!Array.isArray(reviewed.memberships))
    throw new Error("Missing reviewed memberships");
  const { homies, clans, tags, edges } = inventory;
  for (const [kind, rows] of [
    ["homie", homies],
    ["clan", clans],
  ])
    if (filters[kind] && !rows.some((r) => r.slug === filters[kind]))
      throw new Error(`Unknown exact ${kind} slug: ${filters[kind]}`);
  const selected = (h, c) =>
    (!filters.homie || h?.slug === filters.homie) &&
    (!filters.clan || c?.slug === filters.clan);
  const findings = [];
  const add = (kind, detail) => findings.push({ kind, ...detail });
  const byId = new Map(tags.map((t) => [t.id, t]));
  const tagFor = (slug) => tags.find((t) => t.slug === slug);
  const reserved = (t) =>
    t &&
    (t.meta?.identity?.contexts?.unclejimmy ||
      /^\/unclejimmy\//.test(t.href ?? "") ||
      clans.some((c) => c.slug === t.slug));
  for (const [kind, rows, role, identityKind, prefix] of [
    [
      "homie",
      homies.filter((h) => h.name.trim().toLowerCase() !== "backfill"),
      "homie",
      "person",
      "/cardattack/homies/",
    ],
    ["clan", clans, "clan", "group", "/cardattack/clans/"],
  ])
    for (const row of rows) {
      if (filters[kind] && row.slug !== filters[kind]) continue;
      if (
        (filters.homie && kind === "clan") ||
        (filters.clan && kind === "homie")
      )
        continue;
      if (!row.slug) {
        add("unassigned", { entity: kind, id: row.id, name: row.name });
        continue;
      }
      const t = tagFor(row.slug);
      if (!t) {
        add("missing-tag", { entity: kind, id: row.id, slug: row.slug });
        continue;
      }
      if (
        rows.filter((r) => r.slug === row.slug).length !== 1 ||
        (kind === "homie" && reserved(t))
      ) {
        add("ownership-conflict", { entity: kind, id: row.id, slug: row.slug });
        continue;
      }
      const context = t.meta?.identity?.contexts?.cardattack;
      if (
        (kind === "homie" &&
          t.meta?.homie_sync?.homie_id !== undefined &&
          String(t.meta.homie_sync.homie_id) !== String(row.id)) ||
        (kind === "homie" && t.meta?.homie_sync?.retired === true) ||
        t.meta?.identity?.kind !== identityKind ||
        context?.role !== role ||
        context?.href !== prefix + row.slug ||
        t.href !== prefix + row.slug ||
        t.href_kind !== role
      )
        add("metadata-mismatch", {
          entity: kind,
          id: row.id,
          slug: row.slug,
          tagId: t.id,
        });
    }
  for (const edge of edges) {
    const s = byId.get(edge.source),
      t = byId.get(edge.target);
    if (!s || !t) add("dangling-edge", { edgeId: edge.id });
    if (!s || !t || edge.type !== "member_of") continue;
    const h = homies.find((h) => h.slug === s.slug),
      c = clans.find((c) => c.slug === t.slug);
    if (
      c &&
      selected(h, c) &&
      (!h ||
        edge.meta?.membership_basis !== "played_for" ||
        !edge.meta?.evidence_url)
    )
      add("review-existing-edge", {
        edgeId: edge.id,
        source: s.slug,
        clan: c.slug,
        reason: !h
          ? "Source has no current homie assignment; ownership needs evidence"
          : "Missing playing evidence",
      });
  }
  for (const expected of reviewed.memberships) {
    const h = homies.find((h) => h.id === expected.homieId);
    const c = clans.find((c) => c.id === expected.clanId);
    if (!selected(h, c)) continue;
    const s = tagFor(expected.slug),
      t = tagFor(expected.clanSlug);
    const context = s?.meta?.identity?.contexts?.cardattack;
    const valid =
      h?.slug === expected.slug &&
      h?.name === expected.name &&
      c?.slug === expected.clanSlug &&
      homies.filter((r) => r.slug === expected.slug).length === 1 &&
      s &&
      t &&
      !reserved(s) &&
      s.meta?.identity?.kind === "person" &&
      s.href === `/cardattack/homies/${h.slug}` &&
      s.href_kind === "homie" &&
      (!s.meta?.homie_sync ||
        (s.meta.homie_sync.retired !== true &&
          (s.meta.homie_sync.homie_id === undefined ||
            String(s.meta.homie_sync.homie_id) === String(h.id)))) &&
      context?.role === "homie" &&
      context?.href === `/cardattack/homies/${h.slug}` &&
      t.meta?.identity?.kind === "group" &&
      t.href === `/cardattack/clans/${c.slug}` &&
      t.href_kind === "clan" &&
      t.meta?.identity?.contexts?.cardattack?.href ===
        `/cardattack/clans/${c.slug}` &&
      t.meta?.identity?.contexts?.cardattack?.role === "clan" &&
      expected.basis === "played_for" &&
      ["college", "professional"].includes(expected.scope) &&
      /^https:\/\//.test(expected.evidenceUrl ?? "") &&
      /^\d{4}-\d{2}-\d{2}$/.test(expected.reviewedOn ?? "");
    const legacy = expected.legacySlug && tagFor(expected.legacySlug);
    const legacyValid =
      !expected.legacySlug ||
      (legacy &&
        !reserved(legacy) &&
        legacy.meta?.identity?.kind === "person" &&
        legacy.href_kind === "homie" &&
        legacy.href === `/cardattack/homies/${legacy.slug}` &&
        legacy.meta?.identity?.contexts?.cardattack?.role === "homie" &&
        legacy.meta?.identity?.contexts?.cardattack?.href === legacy.href &&
        !homies.some((row) => row.slug === legacy.slug) &&
        expected.identityEvidence &&
        edges.some(
          (e) =>
            e.source === legacy.id &&
            e.target === t?.id &&
            e.type === "member_of" &&
            e.meta?.evidence_url === expected.evidenceUrl &&
            e.meta?.membership_basis === "played_for",
        ));
    if (!valid || !legacyValid) {
      add("ambiguous-reviewed-identity", {
        expected,
        reason:
          "Changed endpoint, conflicting ownership or insufficient evidence",
      });
      continue;
    }
    // Only stored edges count; multiple indirect paths never create duplicates.
    if (
      !edges.some(
        (e) => e.source === s.id && e.target === t.id && e.type === "member_of",
      )
    )
      add("missing-membership", {
        ...expected,
        sourceTagId: s.id,
        targetTagId: t.id,
      });
  }
  return {
    database: inventory.database ?? "unspecified",
    observedAt: inventory.observedAt ?? null,
    filters,
    coverage:
      "Structural inventory plus reviewed positive pairs; playing histories are not exhaustive",
    totals: {
      homies: homies.length,
      named: homies.filter((h) => h.name.trim().toLowerCase() !== "backfill")
        .length,
      clans: clans.length,
      tags: tags.length,
      storedEdges: edges.length,
    },
    placeholders: homies
      .filter((h) => h.name.trim().toLowerCase() === "backfill")
      .map((h) => ({ id: h.id, slug: h.slug })),
    nonAthletes: homies.filter((h) => reviewed.nonAthleteIds?.includes(h.id)),
    findings,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [input, evidence, ...args] = process.argv.slice(2),
      filters = {};
    if (!input || !evidence || args.length % 2)
      throw new Error(
        "Usage: audit-homie-clan-relationships.mjs INVENTORY REVIEWED [--homie SLUG] [--clan SLUG]",
      );
    for (let i = 0; i < args.length; i += 2) {
      if (!["--homie", "--clan"].includes(args[i]))
        throw new Error("Unknown filter");
      filters[args[i].slice(2)] = args[i + 1];
    }
    console.log(
      JSON.stringify(
        audit(
          JSON.parse(readFileSync(input, "utf8")),
          JSON.parse(readFileSync(evidence, "utf8")),
          filters,
        ),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
