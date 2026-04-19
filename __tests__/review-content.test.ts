jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

const getReviewSummaryFromDbMock = jest.fn();
const listReviewReferencesFromDbMock = jest.fn();
const listReviewSummariesFromDbMock = jest.fn();

jest.mock("@/lib/review-db", () => ({
  getReviewSummaryFromDb: (...args: unknown[]) =>
    getReviewSummaryFromDbMock(...args),
  listReviewReferencesFromDb: (...args: unknown[]) =>
    listReviewReferencesFromDbMock(...args),
  listReviewSummariesFromDb: (...args: unknown[]) =>
    listReviewSummariesFromDbMock(...args),
}));

import {
  extractReviewSectionsWithOffsets,
  findReviewSectionsByReferences,
  getReviewPageData,
  getReviewIdAttribute,
  listReviewSummaries,
} from "@/lib/review-content";

beforeEach(() => {
  getReviewSummaryFromDbMock.mockReset();
  listReviewReferencesFromDbMock.mockReset();
  listReviewSummariesFromDbMock.mockReset();

  getReviewSummaryFromDbMock.mockResolvedValue(null);
  listReviewReferencesFromDbMock.mockResolvedValue([]);
  listReviewSummariesFromDbMock.mockResolvedValue([]);
});

describe("getReviewIdAttribute", () => {
  it("normalizes the generic review id attribute format", () => {
    expect(getReviewIdAttribute("golden-age", "  little-red-barn ")).toBe(
      'review={{ type: "golden-age", id: "little-red-barn" }}',
    );
  });
});

describe("extractReviewSectionsWithOffsets", () => {
  it("supports minimal review props and preserves global review ordinals within a post", () => {
    const raw = [
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1" }}>Breakfast</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Antiques</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "chrono-trigger" }}>Games</ReleaseSection>',
    ].join("\n");

    const sections = extractReviewSectionsWithOffsets(raw);

    expect(
      sections.map((section) => ({
        reviewType: section.reviewType,
        externalId: section.externalId,
        sectionOrdinal: section.sectionOrdinal,
      })),
    ).toEqual([
      {
        reviewType: "table-schema",
        externalId: "1",
        sectionOrdinal: 1,
      },
      {
        reviewType: "golden-age",
        externalId: "little-red-barn",
        sectionOrdinal: 2,
      },
      {
        reviewType: "save-point",
        externalId: "chrono-trigger",
        sectionOrdinal: 3,
      },
    ]);
  });
});

describe("findReviewSectionsByReferences", () => {
  it("reconnects DB metadata to the correct MDX section using post_slug and section_ordinal", () => {
    const posts = [
      {
        slug: "self-care",
        title: "self care",
        url: "/shaolin/self-care",
        date: "2026-04-01",
        body: {
          raw: [
            '<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1" }}>Breakfast</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
          ].join("\n"),
        },
      },
    ];

    const sections = findReviewSectionsByReferences(
      "golden-age",
      "little-red-barn",
      [
        {
          postSlug: "self-care",
          postUrl: "/shaolin/self-care",
          postDate: "2026-04-01",
          postTitle: "self care",
          sectionOrdinal: 2,
          ratingRaw: "8.8/10",
          ratingNumeric: 8.8,
        },
      ],
      posts,
    );

    expect(sections).toHaveLength(1);
    expect(sections[0]?.externalId).toBe("little-red-barn");
    expect(sections[0]?.sectionOrdinal).toBe(2);
    expect(sections[0]?.postSlug).toBe("self-care");
    expect(sections[0]?.mdx).toContain("Treasure hunt");
  });
});

describe("listReviewSummaries", () => {
  it("merges DB-backed metadata onto minimal MDX review props and re-sorts by the merged latest date", async () => {
    const posts = [
      {
        slug: "hooky",
        title: "hooky",
        url: "/shaolin/hooky",
        date: "2026-03-05",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "antique-mall" }}>Mall crawl</ReleaseSection>',
        },
      },
      {
        slug: "self-care",
        title: "self care",
        url: "/shaolin/self-care",
        date: "2026-04-01",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
        },
      },
    ];

    listReviewSummariesFromDbMock.mockResolvedValue([
      {
        externalId: "antique-mall",
        name: "Antique Mall",
        averageRating: 9.1,
        visitCount: 2,
        latestPostDate: "2026-05-01",
      },
      {
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
    ]);

    await expect(listReviewSummaries("golden-age", posts)).resolves.toEqual([
      {
        reviewType: "golden-age",
        externalId: "antique-mall",
        name: "Antique Mall",
        averageRating: 9.1,
        visitCount: 2,
        latestPostDate: "2026-05-01",
      },
      {
        reviewType: "golden-age",
        externalId: "little-red-barn",
        name: "Little Red Barn Antiques",
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
    ]);
  });
});

describe("getReviewPageData", () => {
  it("combines DB subject metadata with the original MDX section feed", async () => {
    const posts = [
      {
        slug: "self-care",
        title: "self care",
        url: "/shaolin/self-care",
        date: "2026-04-01",
        body: {
          raw: [
            '<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "1" }}>Breakfast</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
          ].join("\n"),
        },
      },
    ];

    getReviewSummaryFromDbMock.mockResolvedValue({
      externalId: "little-red-barn",
      name: "Little Red Barn Antiques",
      averageRating: 8.8,
      visitCount: 1,
      latestPostDate: "2026-04-01",
    });
    listReviewReferencesFromDbMock.mockResolvedValue([
      {
        postSlug: "self-care",
        postUrl: "/shaolin/self-care",
        postDate: "2026-04-01",
        postTitle: "self care",
        sectionOrdinal: 2,
        ratingRaw: "8.8/10",
        ratingNumeric: 8.8,
      },
    ]);

    await expect(
      getReviewPageData("golden-age", "little-red-barn", posts),
    ).resolves.toEqual({
      reviewType: "golden-age",
      externalId: "little-red-barn",
      name: "Little Red Barn Antiques",
      summary: {
        averageRating: 8.8,
        visitCount: 1,
        latestPostDate: "2026-04-01",
      },
      sections: [
        {
          reviewType: "golden-age",
          externalId: "little-red-barn",
          name: "Little Red Barn Antiques",
          postSlug: "self-care",
          postUrl: "/shaolin/self-care",
          postDate: "2026-04-01",
          postTitle: "self care",
          mdx: '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Treasure hunt</ReleaseSection>',
          ratingRaw: "8.8/10",
          sectionOrdinal: 2,
        },
      ],
    });
  });
});
