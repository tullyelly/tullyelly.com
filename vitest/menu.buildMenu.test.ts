import { describe, it, expect } from "vitest";
import { buildMenuPayload, buildPersonaChildren } from "@/lib/menu/buildMenu";
import type { MenuNodeRow } from "@/lib/menu/dbTypes";

const personaRow = (overrides?: Partial<MenuNodeRow>): MenuNodeRow => ({
  id: 1,
  parent_id: null,
  persona: "mark2",
  kind: "persona",
  label: "mark2",
  href: null,
  target: null,
  icon: "Compass",
  order_index: 0,
  feature_key: null,
  hidden: false,
  meta: {},
  published: true,
  ...overrides,
});

const linkRow = (overrides: Partial<MenuNodeRow>): MenuNodeRow => ({
  id: 2,
  parent_id: 1,
  persona: "mark2",
  kind: "link",
  label: "Shaolin Scrolls",
  href: "/shaolin-scrolls",
  target: null,
  icon: "ScrollText",
  order_index: 0,
  feature_key: null,
  hidden: false,
  meta: {},
  published: true,
  ...overrides,
});

describe("buildMenuPayload", () => {
  it("excludes rows that are hidden or unpublished", async () => {
    const rows: MenuNodeRow[] = [
      personaRow(),
      linkRow({ id: 2, label: "Shaolin Scrolls" }),
      linkRow({
        id: 3,
        label: "Hidden Doc",
        hidden: true,
      }),
      linkRow({
        id: 4,
        label: "Draft Doc",
        published: false,
      }),
    ];

    const menu = await buildMenuPayload(rows, "mark2", () => true);
    const children = await buildPersonaChildren(rows, () => true);

    expect(children.mark2.map((item) => item.label)).toEqual([
      "Shaolin Scrolls",
    ]);
    expect(menu.sections[0]?.items[0]?.label).toBe("mark2");
  });

  it("skips links when gating denies the feature", async () => {
    const rows: MenuNodeRow[] = [
      personaRow(),
      linkRow({
        id: 2,
        label: "Admin",
        feature_key: "menu.mark2.admin",
      }),
      linkRow({
        id: 3,
        label: "Shaolin Scrolls",
        feature_key: "menu.mark2.scrolls",
      }),
    ];

    const menu = await buildMenuPayload(rows, "mark2", (feature) => {
      return feature !== "menu.mark2.admin";
    });
    const children = await buildPersonaChildren(rows, (feature) => {
      return feature !== "menu.mark2.admin";
    });

    expect(children.mark2.map((item) => item.label)).toEqual([
      "Shaolin Scrolls",
    ]);
    expect(
      menu.sections[0]?.items.find((item) => item.label === "mark2"),
    ).toBeDefined();
  });

  it("sorts persona children by order_index", async () => {
    const rows: MenuNodeRow[] = [
      personaRow(),
      linkRow({ id: 2, label: "System Health", order_index: 30 }),
      linkRow({ id: 3, label: "Admin", order_index: 10 }),
      linkRow({ id: 4, label: "Shaolin Scrolls", order_index: 20 }),
    ];

    const children = await buildPersonaChildren(rows, () => true);
    expect(children.mark2.map((item) => item.label)).toEqual([
      "Admin",
      "Shaolin Scrolls",
      "System Health",
    ]);
  });
});
