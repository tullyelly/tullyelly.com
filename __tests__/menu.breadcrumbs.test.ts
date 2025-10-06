import { buildMenuIndex } from "@/lib/menu.index";
import { getBreadcrumbs, getSegmentAwareLabel } from "@/lib/menu.breadcrumbs";
import type { NavItem } from "@/types/nav";

const tree: NavItem[] = [
  {
    id: "persona.tcdb",
    kind: "persona",
    persona: "tullyelly",
    label: "TCDB",
    children: [
      {
        id: "tcdb",
        kind: "link",
        label: "TCDB Home",
        segmentLabel: "TCDB",
        href: "/tcdb",
      },
      {
        id: "sets",
        kind: "link",
        label: "Sets",
        href: "/tcdb/sets",
      },
      {
        id: "sets-1996",
        kind: "link",
        label: "1996 Fleer",
        segmentLabel: "1996 Fleer",
        href: "/tcdb/sets/1996-fleer",
      },
    ],
  },
];

const index = buildMenuIndex(tree);

describe("getSegmentAwareLabel", () => {
  it("prefers segmentLabel when available", () => {
    expect(getSegmentAwareLabel("/tcdb", index)).toBe("TCDB");
  });

  it("falls back to humanized path segments", () => {
    expect(getSegmentAwareLabel("/unknown/path-here", index)).toBe("Path Here");
  });
});

describe("getBreadcrumbs", () => {
  it("returns breadcrumb chain for known paths", () => {
    const crumbs = getBreadcrumbs("/tcdb/sets/1996-fleer", index);
    expect(crumbs).toEqual([
      { label: "TCDB", href: "/tcdb" },
      { label: "Sets", href: "/tcdb/sets" },
      { label: "1996 Fleer", href: "/tcdb/sets/1996-fleer" },
    ]);
  });

  it("falls back to last segment when path is missing", () => {
    const crumbs = getBreadcrumbs("/tcdb/sets/1997-topps", index);
    expect(crumbs.at(-1)).toEqual({
      label: "1997 Topps",
      href: "/tcdb/sets/1997-topps",
    });
  });

  it("returns single crumb for completely unknown path", () => {
    const crumbs = getBreadcrumbs("/mystery", index);
    expect(crumbs).toEqual([{ label: "Mystery", href: "/mystery" }]);
  });
});
