/** @jest-environment node */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tag = (id: number, slug: string, role = "homie") => ({
  id,
  slug,
  href: `/cardattack/${role === "homie" ? "homies" : "clans"}/${slug}`,
  href_kind: role,
  meta: {
    identity: {
      kind: role === "homie" ? "person" : "group",
      contexts: {
        cardattack: {
          role,
          href: `/cardattack/${role === "homie" ? "homies" : "clans"}/${slug}`,
        },
      },
    },
  },
});
const membership = {
  homieId: 1,
  name: "Player",
  slug: "custom",
  clanId: 2,
  clanSlug: "team",
  basis: "played_for",
  scope: "professional",
  evidenceUrl: "https://example.org/official-game",
  reviewedOn: "2026-11-15",
};
const base = () => ({
  homies: [{ id: 1, name: "Player", slug: "custom" }],
  clans: [{ id: 2, name: "Team", slug: "team" }],
  tags: [tag(10, "custom"), tag(20, "team", "clan")],
  edges: [] as {
    id: number;
    source: number;
    target: number;
    type: string;
    meta: object;
  }[],
});
function run(inventory: object, memberships: object[], args: string[] = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "homie-audit-"));
  try {
    writeFileSync(path.join(dir, "inventory.json"), JSON.stringify(inventory));
    writeFileSync(
      path.join(dir, "review.json"),
      JSON.stringify({ memberships }),
    );
    return JSON.parse(
      execFileSync(
        process.execPath,
        [
          "scripts/audit-homie-clan-relationships.mjs",
          path.join(dir, "inventory.json"),
          path.join(dir, "review.json"),
          ...args,
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
it("finds a verified missing membership without needing card counts; repeat audit stops proposing an applied repair", () => {
  const v = base();
  expect(
    run(v, [membership]).findings.map((f: { kind: string }) => f.kind),
  ).toContain("missing-membership");
  v.edges.push({
    id: 1,
    source: 10,
    target: 20,
    type: "member_of",
    meta: {
      membership_basis: "played_for",
      evidence_url: membership.evidenceUrl,
    },
  });
  expect(run(v, [membership]).findings).toEqual([]);
});
it("uses the verified current slug and requires proof for former-slug repair", () => {
  const v = base();
  v.tags.push(tag(11, "old"));
  v.edges.push({
    id: 1,
    source: 11,
    target: 20,
    type: "member_of",
    meta: {
      membership_basis: "played_for",
      evidence_url: membership.evidenceUrl,
    },
  });
  const expected = {
    ...membership,
    legacySlug: "old",
    identityEvidence: "db/migrations/reviewed-seed.sql",
  };
  expect(
    run(v, [expected]).findings.find(
      (f: { kind: string }) => f.kind === "missing-membership",
    ).sourceTagId,
  ).toBe(10);
  expect(
    run(v, [{ ...expected, identityEvidence: undefined }]).findings.some(
      (f: { kind: string }) => f.kind === "ambiguous-reviewed-identity",
    ),
  ).toBe(true);
});
it("refuses a family/athlete collision instead of proposing a transfer", () => {
  const v = base();
  v.tags[0].href = "/unclejimmy/fam/cal";
  expect(
    run(v, [membership]).findings.map((f: { kind: string }) => f.kind),
  ).toEqual(
    expect.arrayContaining([
      "ownership-conflict",
      "ambiguous-reviewed-identity",
    ]),
  );
  expect(
    run(v, [membership]).findings.some(
      (f: { kind: string }) => f.kind === "missing-membership",
    ),
  ).toBe(false);
});
it("ignores duplicate indirect view paths and counts a stored direct edge once", () => {
  const v = {
    ...base(),
    paths: [
      { source: 10, target: 20 },
      { source: 10, target: 20 },
    ],
  };
  expect(
    run(v, [membership]).findings.filter(
      (f: { kind: string }) => f.kind === "missing-membership",
    ),
  ).toHaveLength(1);
  v.edges.push({
    id: 1,
    source: 10,
    target: 20,
    type: "member_of",
    meta: {
      membership_basis: "played_for",
      evidence_url: membership.evidenceUrl,
    },
  });
  expect(run(v, [membership]).findings).toEqual([]);
});
it("holds duplicate or changed identity assignments for review", () => {
  const v = base();
  v.homies.push({ id: 3, name: "Other person", slug: "custom" });
  expect(
    run(v, [membership]).findings.some(
      (f: { kind: string }) => f.kind === "ambiguous-reviewed-identity",
    ),
  ).toBe(true);
});
it("reports placeholders/unassigned separately and supports exact filters without losing discovery totals", () => {
  const v = base();
  v.homies.push(
    { id: 3, name: "backfill", slug: "placeholder" },
    { id: 4, name: "Unassigned", slug: "" },
  );
  const r = run(v, [membership], ["--homie", "custom"]);
  expect(r.totals.homies).toBe(3);
  expect(r.placeholders).toEqual([{ id: 3, slug: "placeholder" }]);
  expect(r.findings).toHaveLength(1);
  expect(() => run(v, [membership], ["--homie", "guessed"])).toThrow();
});

it("holds malformed clan routing and managed ownership drift instead of proposing repairs", () => {
  const v = base();
  v.tags[1].href = "/cardattack/clans/other";
  expect(
    run(v, [membership]).findings.some(
      (f: { kind: string }) => f.kind === "missing-membership",
    ),
  ).toBe(false);
  const other = base();
  Object.assign(other.tags[0].meta, {
    homie_sync: { homie_id: 999, retired: false },
  });
  expect(
    run(other, [membership]).findings.some(
      (f: { kind: string }) => f.kind === "missing-membership",
    ),
  ).toBe(false);
});
