jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

import {
  extractTradeSectionsFromRaw,
  getTcdbTradeSections,
} from "@/lib/tcdb-trades";

describe("extractTradeSectionsFromRaw", () => {
  it("extracts a single ReleaseSection block from raw MDX", () => {
    const tradeId = "123";
    const block = `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">\n  Hello\n</ReleaseSection>`;
    const raw = `Intro\n${block}\nOutro`;

    const sections = extractTradeSectionsFromRaw(raw, tradeId);

    expect(sections).toEqual([{ kind: "original", mdx: block }]);
  });

  it("extracts multiple blocks and filters by tradeId", () => {
    const tradeId = "222";
    const otherId = "111";
    const blockA = `<ReleaseSection alterEgo="mark2" tcdbTradeId="${otherId}">\n  One\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">\n  Two\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}`;

    const sections = extractTradeSectionsFromRaw(raw, tradeId);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.mdx).toBe(blockB);
  });

  it("detects completed attributes on ReleaseSection tags", () => {
    const tradeId = "333";
    const block = `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>\n  Done\n</ReleaseSection>`;

    const sections = extractTradeSectionsFromRaw(block, tradeId);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.kind).toBe("completed");
  });
});

describe("getTcdbTradeSections", () => {
  it("orders original before completed based on post dates", () => {
    const tradeId = "444";
    const posts = [
      {
        slug: "later-original",
        url: "/shaolin/later-original",
        date: "2024-02-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-original",
        url: "/shaolin/earlier-original",
        date: "2024-01-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">Earlier</ReleaseSection>`,
        },
      },
      {
        slug: "completed-early",
        url: "/shaolin/completed-early",
        date: "2024-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>Early</ReleaseSection>`,
        },
      },
      {
        slug: "completed-late",
        url: "/shaolin/completed-late",
        date: "2024-03-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>Late</ReleaseSection>`,
        },
      },
    ];

    const sections = getTcdbTradeSections(tradeId, posts);

    expect(sections.map((section) => section.kind)).toEqual([
      "original",
      "original",
      "completed",
      "completed",
    ]);
    expect(sections[0]?.postSlug).toBe("earlier-original");
    expect(sections[1]?.postSlug).toBe("later-original");
    expect(sections[2]?.postSlug).toBe("completed-late");
    expect(sections[3]?.postSlug).toBe("completed-early");
  });

  it("renders multiple sections for the same tradeId in a single post", () => {
    const tradeId = "555";
    const post = {
      slug: "double-trade",
      url: "/shaolin/double-trade",
      date: "2024-01-10",
      body: {
        raw: [
          `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">`,
          "  First block",
          "</ReleaseSection>",
          "",
          `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">`,
          "  Second block",
          "</ReleaseSection>",
        ].join("\n"),
      },
    };

    const sections = getTcdbTradeSections(tradeId, [post]);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toContain("First block");
    expect(sections[1]?.mdx).toContain("Second block");
  });

  it("preserves in-post order for multiple completed blocks", () => {
    const tradeId = "666";
    const post = {
      slug: "completed-trade",
      url: "/shaolin/completed-trade",
      date: "2024-02-10",
      body: {
        raw: [
          `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>`,
          "  First complete",
          "</ReleaseSection>",
          "",
          `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>`,
          "  Second complete",
          "</ReleaseSection>",
        ].join("\n"),
      },
    };

    const sections = getTcdbTradeSections(tradeId, [post]);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toContain("First complete");
    expect(sections[1]?.mdx).toContain("Second complete");
  });
});
