jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

const getLcsSummaryFromDbMock = jest.fn();
const listLcsDaysFromDbMock = jest.fn();
const listLcsSummariesFromDbMock = jest.fn();

jest.mock("@/lib/lcs-db", () => ({
  getLcsSummaryFromDb: (...args: unknown[]) => getLcsSummaryFromDbMock(...args),
  listLcsDaysFromDb: (...args: unknown[]) => listLcsDaysFromDbMock(...args),
  listLcsSummariesFromDb: (...args: unknown[]) =>
    listLcsSummariesFromDbMock(...args),
}));

import {
  extractLcsSectionsWithOffsets,
  getLcsAttribute,
  getLcsNarrativeDays,
  getLcsPageData,
  getLcsSections,
  listLcsSummaries,
} from "@/lib/lcs-content";

beforeEach(() => {
  getLcsSummaryFromDbMock.mockReset();
  listLcsDaysFromDbMock.mockReset();
  listLcsSummariesFromDbMock.mockReset();

  getLcsSummaryFromDbMock.mockResolvedValue(null);
  listLcsDaysFromDbMock.mockResolvedValue([]);
  listLcsSummariesFromDbMock.mockResolvedValue([]);
});

describe("getLcsAttribute", () => {
  it("returns the normalized lcs attribute format", () => {
    expect(getLcsAttribute(" Indy Card Exchange ")).toBe(
      'lcs="indy-card-exchange"',
    );
  });
});

describe("extractLcsSectionsWithOffsets", () => {
  it("extracts lcs-tagged sections and ignores shared review props", () => {
    const blockA = `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">\n  Day one\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="cardattack" lcs='iconic-sports-cards'>\n  Day two\n</ReleaseSection>`;
    const blockC = `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">\n  Day three\n</ReleaseSection>`;
    const blockD = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "golden-age", id: "legacy-review-prop" }}>\n  Ignore me\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}\n\n${blockC}\n\n${blockD}`;

    const sections = extractLcsSectionsWithOffsets(raw, {
      slug: "indy-card-exchange",
    });

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toBe(blockA);
    expect(sections[0]?.slug).toBe("indy-card-exchange");
    expect(sections[1]?.mdx).toBe(blockC);
    expect(sections[1]?.slug).toBe("indy-card-exchange");
  });
});

describe("getLcsSections", () => {
  it("orders extracted sections by post date ascending", () => {
    const posts = [
      {
        slug: "later-visit",
        title: "Later Visit",
        url: "/shaolin/later-visit",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-visit",
        title: "Earlier Visit",
        url: "/shaolin/earlier-visit",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Earlier</ReleaseSection>`,
        },
      },
    ];

    const sections = getLcsSections("indy-card-exchange", posts);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.slug).toBe("indy-card-exchange");
    expect(sections[0]?.postSlug).toBe("earlier-visit");
    expect(sections[1]?.postSlug).toBe("later-visit");
  });
});

describe("getLcsNarrativeDays", () => {
  it("groups chronicle sections into DB-backed visit-day buckets", async () => {
    listLcsDaysFromDbMock.mockResolvedValue([
      { visitDate: "2026-02-14" },
      { visitDate: "2026-02-16" },
      { visitDate: "2026-02-17" },
    ]);

    const posts = [
      {
        slug: "indy-day-one",
        title: "Indy Day One",
        url: "/shaolin/indy-day-one",
        date: "2026-02-14",
        body: {
          raw: [
            `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">One</ReleaseSection>`,
            "",
            `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Two</ReleaseSection>`,
          ].join("\n"),
        },
      },
      {
        slug: "indy-day-two",
        title: "Indy Day Two",
        url: "/shaolin/indy-day-two",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Three</ReleaseSection>`,
        },
      },
      {
        slug: "other-shop",
        title: "Other Shop",
        url: "/shaolin/other-shop",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" lcs="iconic-sports-cards">Ignore me</ReleaseSection>`,
        },
      },
    ];

    await expect(getLcsNarrativeDays("indy-card-exchange", posts)).resolves.toEqual([
      {
        visitDate: "2026-02-14",
        sections: [
          expect.objectContaining({
            postSlug: "indy-day-one",
            postDate: "2026-02-14",
            sectionOrdinal: 1,
          }),
          expect.objectContaining({
            postSlug: "indy-day-one",
            postDate: "2026-02-14",
            sectionOrdinal: 2,
          }),
        ],
        sourcePosts: [
          {
            slug: "indy-day-one",
            title: "Indy Day One",
            url: "/shaolin/indy-day-one",
            date: "2026-02-14",
          },
        ],
      },
      {
        visitDate: "2026-02-16",
        sections: [
          expect.objectContaining({
            postSlug: "indy-day-two",
            postDate: "2026-02-16",
            sectionOrdinal: 1,
          }),
        ],
        sourcePosts: [
          {
            slug: "indy-day-two",
            title: "Indy Day Two",
            url: "/shaolin/indy-day-two",
            date: "2026-02-16",
          },
        ],
      },
      {
        visitDate: "2026-02-17",
        sections: [],
        sourcePosts: [],
      },
    ]);

    expect(listLcsDaysFromDbMock).toHaveBeenCalledWith("indy-card-exchange");
  });
});

describe("listLcsSummaries", () => {
  it("returns the DB-backed list for local card shops", async () => {
    listLcsSummariesFromDbMock.mockResolvedValue([
      {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: 8.7,
        visitCount: 2,
        latestVisitDate: "2026-02-16",
      },
    ]);

    await expect(listLcsSummaries()).resolves.toEqual([
      {
        slug: "indy-card-exchange",
        name: "Indy Card Exchange",
        city: "Indianapolis",
        state: "IN",
        rating: 8.7,
        visitCount: 2,
        latestVisitDate: "2026-02-16",
      },
    ]);
  });
});

describe("getLcsPageData", () => {
  it("merges DB metadata with narrative days derived from chronicle content", async () => {
    getLcsSummaryFromDbMock.mockResolvedValue({
      slug: "indy-card-exchange",
      name: "Indy Card Exchange",
      city: "Indianapolis",
      state: "IN",
      rating: 8.7,
      url: "https://indycardexchange.com/",
      firstVisitDate: "2026-02-14",
      latestVisitDate: "2026-02-16",
      visitCount: 2,
    });
    listLcsDaysFromDbMock.mockResolvedValue([
      { visitDate: "2026-02-14" },
      { visitDate: "2026-02-16" },
    ]);

    const posts = [
      {
        slug: "indy-day-one",
        title: "Indy Day One",
        url: "/shaolin/indy-day-one",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" lcs="indy-card-exchange">Visit</ReleaseSection>`,
        },
      },
    ];

    const data = await getLcsPageData("indy-card-exchange", posts);

    expect(data).not.toBeNull();
    expect(data).toEqual({
      slug: "indy-card-exchange",
      name: "Indy Card Exchange",
      city: "Indianapolis",
      state: "IN",
      rating: 8.7,
      url: "https://indycardexchange.com/",
      firstVisitDate: "2026-02-14",
      latestVisitDate: "2026-02-16",
      visitCount: 2,
      days: [
        {
          visitDate: "2026-02-14",
          sections: [
            expect.objectContaining({
              postSlug: "indy-day-one",
              postDate: "2026-02-14",
              mdx: expect.stringContaining("Visit"),
            }),
          ],
          sourcePosts: [
            {
              slug: "indy-day-one",
              title: "Indy Day One",
              url: "/shaolin/indy-day-one",
              date: "2026-02-14",
            },
          ],
        },
        {
          visitDate: "2026-02-16",
          sections: [],
          sourcePosts: [],
        },
      ],
    });
  });

  it("returns null when no DB summary exists for the slug", async () => {
    const data = await getLcsPageData("404", []);
    expect(data).toBeNull();
  });
});
