import { flattenLinks } from "@/lib/menu.flatten";
import type { NavItem } from "@/types/nav";

const sampleTree: NavItem[] = [
  {
    id: "persona.mark2",
    kind: "persona",
    persona: "mark2",
    label: "Mark II",
    icon: "Sparkle",
    children: [
      {
        id: "utilities",
        kind: "group",
        label: "Utilities",
        children: [
          {
            id: "link-alpha",
            kind: "link",
            label: "Alpha",
            href: "/alpha",
            hotkey: "⌘1",
            badge: { text: "Beta", tone: "info" },
          },
          {
            id: "link-featured",
            kind: "link",
            label: "Spotlight",
            href: "/spotlight",
            badge: { text: "Featured", type: "featured" },
          },
          {
            id: "link-hidden",
            kind: "link",
            label: "Hidden",
            href: "/hidden",
            hidden: true,
          },
        ],
      },
      {
        id: "external-tool",
        kind: "external",
        label: "Tool",
        href: "https://example.com/tool",
        target: "_blank",
        badge: { text: "New", tone: "new" },
      },
    ],
  },
  {
    id: "loose-link",
    kind: "link",
    label: "Orphan",
    href: "/orphan",
    featured: true,
  },
];

describe("flattenLinks", () => {
  it("skips nodes marked hidden", () => {
    const flat = flattenLinks(sampleTree);
    const ids = flat.map((link) => link.id);
    expect(ids).not.toContain("link-hidden");
  });

  it("preserves persona context, hotkeys, and path labels", () => {
    const flat = flattenLinks(sampleTree);
    const alpha = flat.find((link) => link.id === "link-alpha");
    expect(alpha).toBeDefined();
    expect(alpha?.persona?.label).toBe("Mark II");
    expect(alpha?.pathLabels).toEqual(["Mark II", "Utilities", "Alpha"]);
    expect(alpha?.hotkey).toBe("⌘1");
    expect(alpha?.hotkeyIndex).toBe(1);
  });

  it("marks featured entries via badge type or boolean flag", () => {
    const flat = flattenLinks(sampleTree);
    const badgeFeatured = flat.find((link) => link.id === "link-featured");
    const explicitFeatured = flat.find((link) => link.id === "loose-link");
    expect(badgeFeatured?.featured).toBe(true);
    expect(explicitFeatured?.featured).toBe(true);
  });
});
