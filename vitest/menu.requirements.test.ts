import { describe, it, expect, vi } from "vitest";
import { filterRowsByAccess, buildPersonaChildren } from "@/lib/menu/buildMenu";
import { resolveMenuRequirements } from "@/lib/menu/requirements";
import { createFeatureGate } from "@/lib/menu/featureGate";
import { getFallbackPrimary } from "@/lib/menu/fallback";
import { PERSONA_ORDER } from "@/lib/menu/buildMenu";
import { menuCoverageRows, publicDestinations } from "./fixtures/menu-coverage";

describe("database menu requirements", () => {
  it.each([
    [],
    ["admin.app.view"],
    ["admin.membership.manage"],
    ["admin.app.view", "admin.membership.manage"],
  ])("requires both Admin capabilities: %j", async (...caps: string[]) => {
    const keys = new Set(caps);
    const rows = await filterRowsByAccess(menuCoverageRows(), (key) =>
      keys.has(key),
    );
    expect(rows.filter((row) => row.href === "/mark2/admin")).toHaveLength(
      caps.length === 2 ? 1 : 0,
    );
    expect(rows.filter((row) => row.href).map((row) => row.href)).toEqual(
      expect.arrayContaining(publicDestinations),
    );
    if (caps.length === 2)
      expect(rows.find((row) => row.href === "/mark2/admin")?.feature_key).toBe(
        "menu.mark2.admin",
      );
  });
  it.each([undefined, null, "admin.app.view", {}, [], [null, 3, "  "]])(
    "invalid/empty requirements %j fall back to attribution",
    async (requires) => {
      const row = {
        ...menuCoverageRows()[0],
        feature_key: "legacy",
        meta: { requires },
      };
      expect(resolveMenuRequirements(row)).toEqual(["legacy"]);
      expect(await filterRowsByAccess([row], () => false)).toEqual([]);
    },
  );
  it("normalizes explicit requirements, checks all and caches each decision", async () => {
    const row = {
      ...menuCoverageRows()[0],
      feature_key: "legacy",
      meta: { requires: [" first ", null, "", "second", "first"] },
    };
    const gate = vi.fn(() => true);
    expect(resolveMenuRequirements(row)).toEqual(["first", "second", "first"]);
    expect(
      await filterRowsByAccess([row, { ...row, id: 200 }], gate),
    ).toHaveLength(2);
    expect(gate.mock.calls).toEqual([["first"], ["second"]]);
    expect(await filterRowsByAccess([row], (key) => key === "first")).toEqual(
      [],
    );
  });
  it("fails closed for sync errors, async failures, denied/disabled features and suppressed rows", async () => {
    const rows = menuCoverageRows().filter(
      (row) => row.href === "/mark2/admin",
    );
    for (const fallback of [
      () => false,
      () => {
        throw new Error("failed");
      },
      () => Promise.reject(new Error("disabled")),
    ]) {
      const gate = createFeatureGate({ has: () => false }, fallback);
      expect(await filterRowsByAccess(rows, gate)).toEqual([]);
    }
    expect(
      await filterRowsByAccess(
        [
          { ...rows[0], hidden: true },
          { ...rows[0], published: false },
        ],
        () => true,
      ),
    ).toEqual([]);
  });
  it("retains all public children with empty capabilities", async () => {
    const children = await buildPersonaChildren(
      menuCoverageRows(),
      () => false,
    );
    expect(
      Object.values(children)
        .flat()
        .map((item) => item.href),
    ).toEqual(expect.arrayContaining(publicDestinations));
    expect(children.shaolin.map((item) => item.href)).toEqual([
      "/shaolin",
      "/shaolin/tags",
    ]);
  });
  it("fallback retains approved public routes without stale aliases or gates", () => {
    const items = PERSONA_ORDER.flatMap((persona) =>
      getFallbackPrimary(persona),
    );
    expect(items.map((item) => item.href)).toEqual(
      expect.arrayContaining(publicDestinations),
    );
    for (const item of items) {
      if (item.href !== "/mark2/admin") expect(item.feature).toBeUndefined();
      expect([
        "/docs",
        "/tcdb",
        "/system/health",
        "/mark2/about-personas",
        "/unclejimmy/cute-cards",
        "/shaolin/releases",
      ]).not.toContain(item.href);
    }
  });
});
