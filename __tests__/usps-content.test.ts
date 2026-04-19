jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

const getUspsSummaryFromDbMock = jest.fn();
const listUspsDaysFromDbMock = jest.fn();
const listUspsSummariesFromDbMock = jest.fn();

jest.mock("@/lib/usps-db", () => ({
  getUspsSummaryFromDb: (...args: unknown[]) =>
    getUspsSummaryFromDbMock(...args),
  listUspsDaysFromDb: (...args: unknown[]) => listUspsDaysFromDbMock(...args),
  listUspsSummariesFromDb: (...args: unknown[]) =>
    listUspsSummariesFromDbMock(...args),
  normalizeUspsCitySlug: (value: string) =>
    value
      .trim()
      .replace(/^\/+/g, "")
      .replace(/\/+$/g, "")
      .toLowerCase(),
}));

import {
  extractUspsSectionsWithOffsets,
  getUspsCityAttribute,
  getUspsNarrativeDays,
  getUspsPageData,
  getUspsSections,
  listUspsSummaries,
} from "@/lib/usps-content";

beforeEach(() => {
  getUspsSummaryFromDbMock.mockReset();
  listUspsDaysFromDbMock.mockReset();
  listUspsSummariesFromDbMock.mockReset();

  getUspsSummaryFromDbMock.mockResolvedValue(null);
  listUspsDaysFromDbMock.mockResolvedValue([]);
  listUspsSummariesFromDbMock.mockResolvedValue([]);
});

describe("getUspsCityAttribute", () => {
  it("normalizes the USPS city attribute format", () => {
    expect(getUspsCityAttribute(" Menasha ")).toBe('usps="menasha"');
  });
});

describe("extractUspsSectionsWithOffsets", () => {
  it("supports USPS city slug props on release-linked sections and preserves USPS ordinals within a post", () => {
    const raw = [
      '<ReleaseSection alterEgo="cardattack" releaseId="55" usps="menasha">First visit</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "little-red-barn" }}>Ignore me</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="cardattack" usps="appleton">Other city</ReleaseSection>',
      "",
      '<ReleaseSection alterEgo="cardattack" usps="menasha">Second visit</ReleaseSection>',
    ].join("\n");

    const sections = extractUspsSectionsWithOffsets(raw, {
      citySlug: "menasha",
    });

    expect(
      sections.map((section) => ({
        citySlug: section.citySlug,
        sectionOrdinal: section.sectionOrdinal,
      })),
    ).toEqual([
      {
        citySlug: "menasha",
        sectionOrdinal: 1,
      },
      {
        citySlug: "menasha",
        sectionOrdinal: 3,
      },
    ]);
  });
});

describe("getUspsSections", () => {
  it("sorts extracted sections by normalized post date and preserves section ordinals", () => {
    const posts = [
      {
        slug: "later-mail-day",
        title: "later mail day",
        url: "/shaolin/later-mail-day",
        date: "2026-04-03T06:00:00Z",
        body: {
          raw: '<ReleaseSection alterEgo="cardattack" usps="menasha">Later</ReleaseSection>',
        },
      },
      {
        slug: "earlier-mail-day",
        title: "earlier mail day",
        url: "/shaolin/earlier-mail-day",
        date: "2026-04-01",
        body: {
          raw: [
            '<ReleaseSection alterEgo="cardattack" usps="menasha">First</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="cardattack" usps="menasha">Second</ReleaseSection>',
          ].join("\n"),
        },
      },
    ];

    expect(getUspsSections("menasha", posts)).toEqual([
      expect.objectContaining({
        postSlug: "earlier-mail-day",
        postDate: "2026-04-01",
        sectionOrdinal: 1,
      }),
      expect.objectContaining({
        postSlug: "earlier-mail-day",
        postDate: "2026-04-01",
        sectionOrdinal: 2,
      }),
      expect.objectContaining({
        postSlug: "later-mail-day",
        postDate: "2026-04-03",
        sectionOrdinal: 1,
      }),
    ]);
  });
});

describe("getUspsNarrativeDays", () => {
  it("groups chronicle sections into DB-backed USPS visit-day buckets", async () => {
    listUspsDaysFromDbMock.mockResolvedValue([
      { visitDate: "2026-04-01" },
      { visitDate: "2026-04-03" },
      { visitDate: "2026-04-05" },
    ]);

    const posts = [
      {
        slug: "first-mail-day",
        title: "first mail day",
        url: "/shaolin/first-mail-day",
        date: "2026-04-01T05:00:00Z",
        body: {
          raw: [
            '<ReleaseSection alterEgo="cardattack" usps="menasha">Envelope one</ReleaseSection>',
            "",
            '<ReleaseSection alterEgo="cardattack" usps="menasha">Envelope two</ReleaseSection>',
          ].join("\n"),
        },
      },
      {
        slug: "second-mail-day",
        title: "second mail day",
        url: "/shaolin/second-mail-day",
        date: "2026-04-03",
        body: {
          raw: '<ReleaseSection alterEgo="cardattack" usps="menasha">Mail drop</ReleaseSection>',
        },
      },
      {
        slug: "other-city",
        title: "other city",
        url: "/shaolin/other-city",
        date: "2026-04-03",
        body: {
          raw: '<ReleaseSection alterEgo="cardattack" usps="appleton">Ignore me</ReleaseSection>',
        },
      },
    ];

    await expect(getUspsNarrativeDays("menasha", posts)).resolves.toEqual([
      {
        visitDate: "2026-04-01",
        sections: [
          expect.objectContaining({
            postSlug: "first-mail-day",
            postDate: "2026-04-01",
            sectionOrdinal: 1,
          }),
          expect.objectContaining({
            postSlug: "first-mail-day",
            postDate: "2026-04-01",
            sectionOrdinal: 2,
          }),
        ],
        sourcePosts: [
          {
            slug: "first-mail-day",
            title: "first mail day",
            url: "/shaolin/first-mail-day",
            date: "2026-04-01",
          },
        ],
      },
      {
        visitDate: "2026-04-03",
        sections: [
          expect.objectContaining({
            postSlug: "second-mail-day",
            postDate: "2026-04-03",
            sectionOrdinal: 1,
          }),
        ],
        sourcePosts: [
          {
            slug: "second-mail-day",
            title: "second mail day",
            url: "/shaolin/second-mail-day",
            date: "2026-04-03",
          },
        ],
      },
      {
        visitDate: "2026-04-05",
        sections: [],
        sourcePosts: [],
      },
    ]);

    expect(listUspsDaysFromDbMock).toHaveBeenCalledWith("menasha");
  });
});

describe("listUspsSummaries", () => {
  it("returns the DB-backed list for USPS locations", async () => {
    listUspsSummariesFromDbMock.mockResolvedValue([
      {
        citySlug: "menasha",
        cityName: "Menasha",
        state: "Wisconsin",
        rating: 8.7,
        visitCount: 3,
        latestVisitDate: "2026-04-03",
      },
    ]);

    await expect(listUspsSummaries()).resolves.toEqual([
      {
        citySlug: "menasha",
        cityName: "Menasha",
        state: "Wisconsin",
        rating: 8.7,
        visitCount: 3,
        latestVisitDate: "2026-04-03",
      },
    ]);
  });
});

describe("getUspsPageData", () => {
  it("merges DB metadata with narrative days derived from the chronicle content", async () => {
    getUspsSummaryFromDbMock.mockResolvedValue({
      citySlug: "menasha",
      cityName: "Menasha",
      state: "Wisconsin",
      rating: 8.7,
      visitCount: 3,
      firstVisitDate: "2026-04-01",
      latestVisitDate: "2026-04-05",
    });
    listUspsDaysFromDbMock.mockResolvedValue([
      { visitDate: "2026-04-01" },
      { visitDate: "2026-04-05" },
    ]);

    const posts = [
      {
        slug: "mail-day",
        title: "mail day",
        url: "/shaolin/mail-day",
        date: "2026-04-01",
        body: {
          raw: '<ReleaseSection alterEgo="cardattack" releaseId="55" usps="menasha">Envelope stack</ReleaseSection>',
        },
      },
    ];

    await expect(getUspsPageData("menasha", posts)).resolves.toEqual({
      citySlug: "menasha",
      cityName: "Menasha",
      state: "Wisconsin",
      rating: 8.7,
      visitCount: 3,
      firstVisitDate: "2026-04-01",
      latestVisitDate: "2026-04-05",
      days: [
        {
          visitDate: "2026-04-01",
          sections: [
            expect.objectContaining({
              mdx: expect.stringContaining('releaseId="55"'),
              postSlug: "mail-day",
              postDate: "2026-04-01",
              sectionOrdinal: 1,
            }),
          ],
          sourcePosts: [
            {
              slug: "mail-day",
              title: "mail day",
              url: "/shaolin/mail-day",
              date: "2026-04-01",
            },
          ],
        },
        {
          visitDate: "2026-04-05",
          sections: [],
          sourcePosts: [],
        },
      ],
    });
  });
});
