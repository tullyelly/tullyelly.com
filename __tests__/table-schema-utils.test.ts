jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

import {
  extractTableSchemaSectionsWithOffsets,
  getAllTableSchemaSummaries,
  getTableSchemaIdAttribute,
  getTableSchemaPageData,
  getTableSchemaSections,
  summarizeTableSchemaSections,
} from "@/lib/table-schema";

describe("getTableSchemaIdAttribute", () => {
  it("returns the normalized tableSchemaId attribute format", () => {
    expect(getTableSchemaIdAttribute(" 42 ")).toBe(
      'review={{ type: "table-schema", id: "42" }}',
    );
  });
});

describe("extractTableSchemaSectionsWithOffsets", () => {
  it("extracts sections with review objects and ignores non table-schema reviews", () => {
    const blockA = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 1, name: "Pizza Shack", url: "https://pizza-shack.example.com", rating: "8.5/10" }}>\n  Day one\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="unclejimmy" review={{ type: 'table-schema', id: "2", name: 'Burger Barn', rating: '7.0' }}>\n  Day two\n</ReleaseSection>`;
    const blockC = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1", name: "Pizza Shack", rating: "9/10" }}>\n  Day three\n</ReleaseSection>`;
    const blockD = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "lcs", id: "not-a-restaurant", name: "Card Shop", rating: "9.9" }}>\n  Skip\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}\n\n${blockC}\n\n${blockD}`;

    const sections = extractTableSchemaSectionsWithOffsets(raw, "1");

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toBe(blockA);
    expect(sections[0]?.tableSchemaName).toBe("Pizza Shack");
    expect(sections[0]?.tableSchemaUrl).toBe("https://pizza-shack.example.com");
    expect(sections[0]?.tableSchemaRating).toBe("8.5/10");
    expect(sections[1]?.mdx).toBe(blockC);
    expect(sections[1]?.tableSchemaId).toBe("1");
  });
});

describe("getTableSchemaSections", () => {
  it("orders extracted sections by post date ascending", () => {
    const posts = [
      {
        slug: "later-visit",
        title: "Later Visit",
        url: "/shaolin/later-visit",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1", name: "Pizza Shack", rating: "9/10" }}>Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-visit",
        title: "Earlier Visit",
        url: "/shaolin/earlier-visit",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1", name: "Pizza Shack", rating: "8.5/10" }}>Earlier</ReleaseSection>`,
        },
      },
    ];

    const sections = getTableSchemaSections("1", posts);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.postSlug).toBe("earlier-visit");
    expect(sections[1]?.postSlug).toBe("later-visit");
  });
});

describe("summarizeTableSchemaSections", () => {
  it("parses numeric ratings, ignores invalid ratings, and rounds to one decimal", () => {
    const sections = [
      {
        tableSchemaId: "1",
        postSlug: "a",
        postUrl: "/shaolin/a",
        postDate: "2026-02-14",
        postTitle: "A",
        tableSchemaName: "Pizza Shack",
        tableSchemaUrl: "https://pizza-shack.example.com",
        tableSchemaRating: "8.5",
        mdx: "<ReleaseSection />",
      },
      {
        tableSchemaId: "1",
        postSlug: "b",
        postUrl: "/shaolin/b",
        postDate: "2026-02-15",
        postTitle: "B",
        tableSchemaName: "Pizza Shack",
        tableSchemaUrl: "https://pizza-shack.example.com",
        tableSchemaRating: "8.5/10",
        mdx: "<ReleaseSection />",
      },
      {
        tableSchemaId: "1",
        postSlug: "c",
        postUrl: "/shaolin/c",
        postDate: "2026-02-16",
        postTitle: "C",
        tableSchemaName: "Pizza Shack",
        tableSchemaUrl: "https://pizza-shack.example.com",
        tableSchemaRating: "9/10",
        mdx: "<ReleaseSection />",
      },
      {
        tableSchemaId: "1",
        postSlug: "d",
        postUrl: "/shaolin/d",
        postDate: "2026-02-17",
        postTitle: "D",
        tableSchemaName: "Pizza Shack",
        tableSchemaUrl: "https://pizza-shack.example.com",
        tableSchemaRating: "unknown",
        mdx: "<ReleaseSection />",
      },
    ];

    const summary = summarizeTableSchemaSections(sections);

    expect(summary.tableSchemaName).toBe("Pizza Shack");
    expect(summary.tableSchemaUrl).toBe("https://pizza-shack.example.com");
    expect(summary.averageRating).toBe(8.7);
    expect(summary.visitCount).toBe(4);
  });
});

describe("getAllTableSchemaSummaries", () => {
  it("groups by tableSchemaId and sorts by latest post date descending", () => {
    const posts = [
      {
        slug: "pizza-early",
        title: "Pizza Early",
        url: "/shaolin/pizza-early",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 1, rating: "8.0" }}>Visit</ReleaseSection>`,
        },
      },
      {
        slug: "burger-late",
        title: "Burger Late",
        url: "/shaolin/burger-late",
        date: "2026-02-17",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 2, name: "Burger Barn", url: "https://burger-barn.example.com", rating: "7.5/10" }}>Visit</ReleaseSection>`,
        },
      },
      {
        slug: "pizza-late",
        title: "Pizza Late",
        url: "/shaolin/pizza-late",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 1, name: "Pizza Shack", rating: "9/10" }}>Visit</ReleaseSection>`,
        },
      },
    ];

    const summaries = getAllTableSchemaSummaries(posts);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.tableSchemaId).toBe("2");
    expect(summaries[0]?.tableSchemaName).toBe("Burger Barn");
    expect(summaries[0]?.tableSchemaUrl).toBe("https://burger-barn.example.com");
    expect(summaries[0]?.averageRating).toBe(7.5);
    expect(summaries[0]?.visitCount).toBe(1);
    expect(summaries[1]?.tableSchemaId).toBe("1");
    expect(summaries[1]?.tableSchemaName).toBe("Pizza Shack");
    expect(summaries[1]?.averageRating).toBe(8.5);
    expect(summaries[1]?.visitCount).toBe(2);
    expect(summaries[1]?.latestPostDate).toBe("2026-02-16");
  });
});

describe("getTableSchemaPageData", () => {
  it("returns normalized page data for existing table schemas", () => {
    const posts = [
      {
        slug: "pizza",
        title: "Pizza",
        url: "/shaolin/pizza",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: 1, name: "Pizza Shack", url: "https://pizza-shack.example.com", rating: "9/10" }}>Visit</ReleaseSection>`,
        },
      },
    ];

    const data = getTableSchemaPageData("1", posts);

    expect(data).not.toBeNull();
    expect(data?.tableSchemaId).toBe("1");
    expect(data?.tableSchemaName).toBe("Pizza Shack");
    expect(data?.tableSchemaUrl).toBe("https://pizza-shack.example.com");
    expect(data?.summary.averageRating).toBe(9);
    expect(data?.summary.visitCount).toBe(1);
    expect(data?.sections).toHaveLength(1);
  });

  it("returns null when no sections exist for the id", () => {
    const data = getTableSchemaPageData("404", []);
    expect(data).toBeNull();
  });
});
