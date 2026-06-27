/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getSquadPageContent,
  getSquadPageItemHref,
  groupSquadPageContentRows,
} from "@/lib/unclejimmy/squadPageContent";

describe("squadPageContent", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("groups flat DB rows into ordered squad page sections", () => {
    const sections = groupSquadPageContentRows([
      {
        section_key: "trackers",
        section_title: "trackers",
        section_description: "Follow active logs and summaries:",
        section_display_order: "20",
        item_slug: "volleyball-tournaments",
        item_label: "Volleyball Tournaments",
        item_blurb: "Track volleyball tournament summaries.",
        item_href: "/unclejimmy/squad/volleyball",
        item_kind: "link",
        item_display_order: "20",
        item_meta: { featured: true },
      },
      {
        section_key: "coming-soon",
        section_title: "coming soon....",
        section_description: null,
        section_display_order: 30,
        item_slug: null,
        item_label: null,
        item_blurb: null,
        item_href: null,
        item_kind: null,
        item_display_order: null,
        item_meta: null,
      },
      {
        section_key: "trackers",
        section_title: "trackers",
        section_description: "Follow active logs and summaries:",
        section_display_order: 20,
        item_slug: "table-schema",
        item_label: "Table Schema",
        item_blurb: "Track the table schema log.",
        item_href: "/unclejimmy/table-schema",
        item_kind: "link",
        item_display_order: 10,
        item_meta: null,
      },
      {
        section_key: "nuclear-reactor",
        section_title: "nuclear reactor",
        section_description: "Primary sources of energy:",
        section_display_order: 10,
        item_slug: "BONNIBEL",
        item_label: " bonnibel ",
        item_blurb: " Placeholder blurb ",
        item_href: null,
        item_kind: "person",
        item_display_order: 20,
        item_meta: null,
      },
    ]);

    expect(
      sections.map((section) => ({
        sectionKey: section.sectionKey,
        title: section.title,
        description: section.description,
        itemSlugs: section.items.map((item) => item.slug),
      })),
    ).toEqual([
      {
        sectionKey: "nuclear-reactor",
        title: "nuclear reactor",
        description: "Primary sources of energy:",
        itemSlugs: ["bonnibel"],
      },
      {
        sectionKey: "trackers",
        title: "trackers",
        description: "Follow active logs and summaries:",
        itemSlugs: ["table-schema", "volleyball-tournaments"],
      },
      {
        sectionKey: "coming-soon",
        title: "coming soon....",
        description: undefined,
        itemSlugs: [],
      },
    ]);

    expect(sections[0]?.items[0]).toEqual(
      expect.objectContaining({
        label: "bonnibel",
        blurb: "Placeholder blurb",
        kind: "person",
      }),
    );
    expect(sections[1]?.items[1]?.meta).toEqual({ featured: true });
  });

  it("resolves explicit, fallback, and placeholder item links", () => {
    expect(
      getSquadPageItemHref({
        slug: "nikkigirl",
        kind: "person",
        href: "/shaolin/tags/nikkigirl",
      }),
    ).toBe("/shaolin/tags/nikkigirl");

    expect(
      getSquadPageItemHref({
        slug: "jeff-meff",
        kind: "person",
      }),
    ).toBe("/unclejimmy/squad/jeff-meff");

    expect(
      getSquadPageItemHref({
        slug: "future team",
        kind: "team",
      }),
    ).toBe("/unclejimmy/squad/future%20team");

    expect(
      getSquadPageItemHref({
        slug: "g-league",
        kind: "placeholder",
      }),
    ).toBeNull();
  });

  it("loads squad page content from the published view", async () => {
    mockSql.mockResolvedValue([
      {
        section_key: "trackers",
        section_title: "trackers",
        section_description: "Follow active logs and summaries:",
        section_display_order: 20,
        item_slug: "table-schema",
        item_label: "Table Schema",
        item_blurb: "Track the table schema log.",
        item_href: "/unclejimmy/table-schema",
        item_kind: "link",
        item_display_order: 10,
        item_meta: null,
      },
    ]);

    await expect(getSquadPageContent()).resolves.toEqual([
      expect.objectContaining({
        sectionKey: "trackers",
        items: [
          expect.objectContaining({
            slug: "table-schema",
            href: "/unclejimmy/table-schema",
          }),
        ],
      }),
    ]);

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [strings, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(strings.join("?")).toContain(
      "FROM dojo.v_unclejimmy_squad_page_content",
    );
    expect(values).toEqual([]);
  });
});
