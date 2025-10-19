import { buildMenuIndex } from "@/lib/menu.index";
import type { NavItem } from "@/types/nav";

describe("buildMenuIndex", () => {
  const tree: NavItem[] = [
    {
      id: "persona.tcdb",
      kind: "persona",
      persona: "tullyelly",
      label: "TCDB",
      children: [
        {
          id: "tcdb-home",
          kind: "link",
          label: "Overview",
          href: "/tcdb",
        },
        {
          id: "tcdb-sets",
          kind: "link",
          label: "Sets",
          href: "/tcdb/sets",
        },
        {
          id: "tcdb-sets-1996",
          kind: "link",
          label: "1996 Fleer",
          href: "/tcdb/sets/1996-fleer",
        },
        {
          id: "hidden-link",
          kind: "link",
          label: "Hidden",
          href: "/tcdb/secret",
          hidden: true,
        },
      ],
    },
  ];

  it("indexes visible link nodes only", () => {
    const index = buildMenuIndex(tree);
    expect(index.byPath.has("/tcdb")).toBe(true);
    expect(index.byPath.has("/tcdb/sets")).toBe(true);
    expect(index.byPath.has("/tcdb/sets/1996-fleer")).toBe(true);
    expect(index.byPath.has("/tcdb/secret")).toBe(false);
  });

  it("records parent chain keyed by href", () => {
    const index = buildMenuIndex(tree);
    expect(index.parents.get("/tcdb")).toBeNull();
    expect(index.parents.get("/tcdb/sets")).toBe("/tcdb");
    expect(index.parents.get("/tcdb/sets/1996-fleer")).toBe("/tcdb/sets");
  });
});
