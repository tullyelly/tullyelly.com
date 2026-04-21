jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

const getBricksSummaryFromDbMock = jest.fn();
const listBricksDaysFromDbMock = jest.fn();
const listBricksSummariesFromDbMock = jest.fn();

jest.mock("@/lib/bricks-db", () => ({
  getBricksSummaryFromDb: (...args: unknown[]) =>
    getBricksSummaryFromDbMock(...args),
  listBricksDaysFromDb: (...args: unknown[]) =>
    listBricksDaysFromDbMock(...args),
  listBricksSummariesFromDb: (...args: unknown[]) =>
    listBricksSummariesFromDbMock(...args),
}));

import {
  extractBricksSectionsWithOffsets,
  getBricksIdAttribute,
  getBricksNarrativeDays,
  getBricksPageData,
  getBricksSections,
  listBricksSummaries,
} from "@/lib/bricks-content";

beforeEach(() => {
  getBricksSummaryFromDbMock.mockReset();
  listBricksDaysFromDbMock.mockReset();
  listBricksSummariesFromDbMock.mockReset();

  getBricksSummaryFromDbMock.mockResolvedValue(null);
  listBricksDaysFromDbMock.mockResolvedValue([]);
  listBricksSummariesFromDbMock.mockResolvedValue([]);
});

describe("getBricksIdAttribute", () => {
  it("normalizes the generic bricks id attribute format", () => {
    expect(getBricksIdAttribute("lego", " 10330 ")).toBe(
      'bricks="10330"',
    );
  });
});

describe("extractBricksSectionsWithOffsets", () => {
  it("supports minimal bricks props and preserves bricks ordinals within a post", () => {
    const raw = [
      '<ReleaseSection alterEgo="unclejimmy" bricks="10330">First build</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics" }}>Ignore me</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="unclejimmy" bricks="42171">Second build</ReleaseSection>',
    ].join("\n");

    const sections = extractBricksSectionsWithOffsets(raw);

    expect(
      sections.map((section) => ({
        subset: section.subset,
        publicId: section.publicId,
        sectionOrdinal: section.sectionOrdinal,
      })),
    ).toEqual([
      {
        subset: "lego",
        publicId: "10330",
        sectionOrdinal: 1,
      },
      {
        subset: "lego",
        publicId: "42171",
        sectionOrdinal: 2,
      },
    ]);
  });
});

describe("getBricksSections", () => {
  it("sorts extracted sections by normalized post date and preserves section ordinals", () => {
    const posts = [
      {
        slug: "later-build",
        title: "later build",
        url: "/shaolin/later-build",
        date: "2026-04-03T06:00:00Z",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Later</ReleaseSection>',
        },
      },
      {
        slug: "earlier-build",
        title: "earlier build",
        url: "/shaolin/earlier-build",
        date: "2026-04-01",
        body: {
          raw: [
            '<ReleaseSection alterEgo="unclejimmy" bricks="10330">First</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Second</ReleaseSection>',
          ].join("\n"),
        },
      },
    ];

    expect(getBricksSections("lego", "10330", posts)).toEqual([
      expect.objectContaining({
        postSlug: "earlier-build",
        postDate: "2026-04-01",
        sectionOrdinal: 1,
      }),
      expect.objectContaining({
        postSlug: "earlier-build",
        postDate: "2026-04-01",
        sectionOrdinal: 2,
      }),
      expect.objectContaining({
        postSlug: "later-build",
        postDate: "2026-04-03",
        sectionOrdinal: 1,
      }),
    ]);
  });
});

describe("getBricksNarrativeDays", () => {
  it("groups chronicle sections into DB-backed build-day buckets", async () => {
    listBricksDaysFromDbMock.mockResolvedValue([
      { buildDate: "2026-04-01", bags: "1-3" },
      { buildDate: "2026-04-03", bags: "4-6" },
      { buildDate: "2026-04-05", bags: "7-9" },
    ]);

    const posts = [
      {
        slug: "first-day",
        title: "first day",
        url: "/shaolin/first-day",
        date: "2026-04-01T05:00:00Z",
        body: {
          raw: [
            '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Bag 1</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Bag 2</ReleaseSection>',
          ].join("\n"),
        },
      },
      {
        slug: "second-day",
        title: "second day",
        url: "/shaolin/second-day",
        date: "2026-04-03",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Bag 4</ReleaseSection>',
        },
      },
      {
        slug: "other-set",
        title: "other set",
        url: "/shaolin/other-set",
        date: "2026-04-03",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" bricks="42171">Ignore me</ReleaseSection>',
        },
      },
    ];

    await expect(
      getBricksNarrativeDays("lego", "10330", posts),
    ).resolves.toEqual([
      {
        buildDate: "2026-04-01",
        bags: "1-3",
        sections: [
          expect.objectContaining({
            postSlug: "first-day",
            postDate: "2026-04-01",
            sectionOrdinal: 1,
          }),
          expect.objectContaining({
            postSlug: "first-day",
            postDate: "2026-04-01",
            sectionOrdinal: 2,
          }),
        ],
        sourcePosts: [
          {
            slug: "first-day",
            title: "first day",
            url: "/shaolin/first-day",
            date: "2026-04-01",
          },
        ],
      },
      {
        buildDate: "2026-04-03",
        bags: "4-6",
        sections: [
          expect.objectContaining({
            postSlug: "second-day",
            postDate: "2026-04-03",
            sectionOrdinal: 1,
          }),
        ],
        sourcePosts: [
          {
            slug: "second-day",
            title: "second day",
            url: "/shaolin/second-day",
            date: "2026-04-03",
          },
        ],
      },
      {
        buildDate: "2026-04-05",
        bags: "7-9",
        sections: [],
        sourcePosts: [],
      },
    ]);

    expect(listBricksDaysFromDbMock).toHaveBeenCalledWith("lego", "10330");
  });
});

describe("listBricksSummaries", () => {
  it("returns the DB-backed list for a subset", async () => {
    listBricksSummariesFromDbMock.mockResolvedValue([
      {
        subset: "lego",
        publicId: "10330",
        setName: "McLaren MP4/4 & Ayrton Senna",
        reviewScore: 9.2,
        sessionCount: 2,
        latestBuildDate: "2026-04-03",
      },
    ]);

    await expect(listBricksSummaries("lego")).resolves.toEqual([
      {
        subset: "lego",
        publicId: "10330",
        setName: "McLaren MP4/4 & Ayrton Senna",
        reviewScore: 9.2,
        sessionCount: 2,
        latestBuildDate: "2026-04-03",
      },
    ]);
  });
});

describe("getBricksPageData", () => {
  it("merges DB metadata with narrative days derived from the chronicle content", async () => {
    getBricksSummaryFromDbMock.mockResolvedValue({
      subset: "lego",
      publicId: "10330",
      setName: "McLaren MP4/4 & Ayrton Senna",
      tag: "f1",
      pieceCount: 693,
      reviewScore: 9.3,
      firstBuildDate: "2026-04-01",
      latestBuildDate: "2026-04-03",
      sessionCount: 2,
    });
    listBricksDaysFromDbMock.mockResolvedValue([
      { buildDate: "2026-04-01", bags: "1-3" },
      { buildDate: "2026-04-03", bags: "4-6" },
    ]);

    const posts = [
      {
        slug: "timeout",
        title: "timeout",
        url: "/shaolin/timeout",
        date: "2026-04-01",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Opening bags</ReleaseSection>',
        },
      },
      {
        slug: "saturday-oooh-ooooh",
        title: "saturday oooh ooooh",
        url: "/shaolin/saturday-oooh-ooooh",
        date: "2026-04-03",
        body: {
          raw: '<ReleaseSection alterEgo="unclejimmy" bricks="10330">Finishing touches</ReleaseSection>',
        },
      },
    ];

    await expect(getBricksPageData("lego", "10330", posts)).resolves.toEqual({
      subset: "lego",
      publicId: "10330",
      setName: "McLaren MP4/4 & Ayrton Senna",
      tag: "f1",
      pieceCount: 693,
      reviewScore: 9.3,
      firstBuildDate: "2026-04-01",
      latestBuildDate: "2026-04-03",
      sessionCount: 2,
      days: [
        {
          buildDate: "2026-04-01",
          bags: "1-3",
          sections: [
            expect.objectContaining({
              postSlug: "timeout",
              postDate: "2026-04-01",
              mdx: expect.stringContaining("Opening bags"),
            }),
          ],
          sourcePosts: [
            {
              slug: "timeout",
              title: "timeout",
              url: "/shaolin/timeout",
              date: "2026-04-01",
            },
          ],
        },
        {
          buildDate: "2026-04-03",
          bags: "4-6",
          sections: [
            expect.objectContaining({
              postSlug: "saturday-oooh-ooooh",
              postDate: "2026-04-03",
              mdx: expect.stringContaining("Finishing touches"),
            }),
          ],
          sourcePosts: [
            {
              slug: "saturday-oooh-ooooh",
              title: "saturday oooh ooooh",
              url: "/shaolin/saturday-oooh-ooooh",
              date: "2026-04-03",
            },
          ],
        },
      ],
    });
  });
});
