import { buildCapabilities } from "@/app/_auth/capabilities";
import { filterByRequires } from "@/lib/menu";
import type { NavItem, PersonaItem } from "@/types/nav";

function buildFixture(): NavItem[] {
  return [
    {
      id: "persona.mark2",
      kind: "persona",
      persona: "mark2",
      label: "mark2",
      icon: "Brain",
      children: [
        {
          id: "alpha",
          kind: "link",
          label: "Alpha",
          href: "/alpha",
        },
        {
          id: "beta",
          kind: "link",
          label: "Beta",
          href: "/beta",
          requires: ["menu.beta"],
        },
        {
          id: "gamma",
          kind: "link",
          label: "Gamma",
          href: "/gamma",
          requires: ["menu.gamma", "feature.special"],
        },
        {
          id: "hidden",
          kind: "link",
          label: "Hidden",
          href: "/hidden",
          hidden: true,
          requires: ["menu.hidden"],
        },
        {
          id: "tools",
          kind: "group",
          label: "Tools",
          requires: ["menu.tools"],
          children: [
            {
              id: "tool-one",
              kind: "external",
              label: "Tool One",
              href: "https://example.com",
              requires: ["tool.one"],
            },
            {
              id: "tool-two",
              kind: "link",
              label: "Tool Two",
              href: "/tool-two",
              featureKey: "tool.two",
            },
          ],
        },
      ],
    },
  ];
}

function firstPersona(nodes: NavItem[]): PersonaItem | undefined {
  const [first] = nodes;
  if (first?.kind === "persona") {
    return first;
  }
  return undefined;
}

describe("filterByRequires", () => {
  it("matches the expected snapshot before and after filtering", () => {
    const original = buildFixture();
    expect(original).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "href": "/alpha",
              "id": "alpha",
              "kind": "link",
              "label": "Alpha",
            },
            {
              "href": "/beta",
              "id": "beta",
              "kind": "link",
              "label": "Beta",
              "requires": [
                "menu.beta",
              ],
            },
            {
              "href": "/gamma",
              "id": "gamma",
              "kind": "link",
              "label": "Gamma",
              "requires": [
                "menu.gamma",
                "feature.special",
              ],
            },
            {
              "hidden": true,
              "href": "/hidden",
              "id": "hidden",
              "kind": "link",
              "label": "Hidden",
              "requires": [
                "menu.hidden",
              ],
            },
            {
              "children": [
                {
                  "href": "https://example.com",
                  "id": "tool-one",
                  "kind": "external",
                  "label": "Tool One",
                  "requires": [
                    "tool.one",
                  ],
                },
                {
                  "featureKey": "tool.two",
                  "href": "/tool-two",
                  "id": "tool-two",
                  "kind": "link",
                  "label": "Tool Two",
                },
              ],
              "id": "tools",
              "kind": "group",
              "label": "Tools",
              "requires": [
                "menu.tools",
              ],
            },
          ],
          "icon": "Brain",
          "id": "persona.mark2",
          "kind": "persona",
          "label": "mark2",
          "persona": "mark2",
        },
      ]
    `);

    const capabilities = buildCapabilities([
      "menu.beta",
      "menu.gamma",
      "feature.special",
      "menu.tools",
      "tool.two",
    ]);
    const filtered = filterByRequires(original, capabilities.has);
    expect(filtered).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "href": "/alpha",
              "id": "alpha",
              "kind": "link",
              "label": "Alpha",
            },
            {
              "href": "/beta",
              "id": "beta",
              "kind": "link",
              "label": "Beta",
              "requires": [
                "menu.beta",
              ],
            },
            {
              "href": "/gamma",
              "id": "gamma",
              "kind": "link",
              "label": "Gamma",
              "requires": [
                "menu.gamma",
                "feature.special",
              ],
            },
            {
              "children": [
                {
                  "featureKey": "tool.two",
                  "href": "/tool-two",
                  "id": "tool-two",
                  "kind": "link",
                  "label": "Tool Two",
                },
              ],
              "id": "tools",
              "kind": "group",
              "label": "Tools",
              "requires": [
                "menu.tools",
              ],
            },
          ],
          "icon": "Brain",
          "id": "persona.mark2",
          "kind": "persona",
          "label": "mark2",
          "persona": "mark2",
        },
      ]
    `);
  });

  it("denies nodes when capabilities are empty", () => {
    const filtered = filterByRequires(
      buildFixture(),
      buildCapabilities([]).has,
    );
    const persona = firstPersona(filtered);
    expect(persona?.children).toEqual([
      {
        id: "alpha",
        kind: "link",
        label: "Alpha",
        href: "/alpha",
      },
    ]);
  });
});
