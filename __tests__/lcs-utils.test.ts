jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

import {
  extractLcsSectionsWithOffsets,
  getAllLcsSummaries,
  getLcsIdAttribute,
  getLcsPageData,
  getLcsSections,
  summarizeLcsSections,
} from "@/lib/lcs";

describe("getLcsIdAttribute", () => {
  it("returns the normalized lcs id attribute format", () => {
    expect(getLcsIdAttribute(" indy-card-exchange ")).toBe(
      'review={{ type: "lcs", id: "indy-card-exchange" }}',
    );
  });
});

describe("extractLcsSectionsWithOffsets", () => {
  it("extracts sections with lcs review objects and ignores non-lcs reviews", () => {
    const blockA = `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.7/10" }}>\n  Day one\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="cardattack" review={{ type: 'lcs', id: "iconic-sports-cards", name: 'Iconic Sports Cards', rating: '8.5' }}>\n  Day two\n</ReleaseSection>`;
    const blockC = `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.9/10" }}>\n  Day three\n</ReleaseSection>`;
    const blockD = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "table-schema", id: "pizza-shack", name: "Pizza Shack", rating: "9.2" }}>\n  Skip\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}\n\n${blockC}\n\n${blockD}`;

    const sections = extractLcsSectionsWithOffsets(raw, "indy-card-exchange");

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toBe(blockA);
    expect(sections[0]?.lcsName).toBe("Indy Card Exchange");
    expect(sections[0]?.lcsRating).toBe("8.7/10");
    expect(sections[1]?.mdx).toBe(blockC);
    expect(sections[1]?.lcsId).toBe("indy-card-exchange");
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
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.9/10" }}>Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-visit",
        title: "Earlier Visit",
        url: "/shaolin/earlier-visit",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.7/10" }}>Earlier</ReleaseSection>`,
        },
      },
    ];

    const sections = getLcsSections("indy-card-exchange", posts);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.postSlug).toBe("earlier-visit");
    expect(sections[1]?.postSlug).toBe("later-visit");
  });
});

describe("summarizeLcsSections", () => {
  it("parses numeric ratings, ignores invalid ratings, and rounds to one decimal", () => {
    const sections = [
      {
        lcsId: "indy-card-exchange",
        postSlug: "a",
        postUrl: "/shaolin/a",
        postDate: "2026-02-14",
        postTitle: "A",
        lcsName: "Indy Card Exchange",
        lcsUrl: "https://indycardexchange.com/",
        lcsRating: "8.7",
        mdx: "<ReleaseSection />",
      },
      {
        lcsId: "indy-card-exchange",
        postSlug: "b",
        postUrl: "/shaolin/b",
        postDate: "2026-02-15",
        postTitle: "B",
        lcsName: "Indy Card Exchange",
        lcsUrl: "https://indycardexchange.com/",
        lcsRating: "8.9/10",
        mdx: "<ReleaseSection />",
      },
      {
        lcsId: "indy-card-exchange",
        postSlug: "c",
        postUrl: "/shaolin/c",
        postDate: "2026-02-16",
        postTitle: "C",
        lcsName: "Indy Card Exchange",
        lcsUrl: "https://indycardexchange.com/",
        lcsRating: "unknown",
        mdx: "<ReleaseSection />",
      },
    ];

    const summary = summarizeLcsSections(sections);

    expect(summary.lcsName).toBe("Indy Card Exchange");
    expect(summary.lcsUrl).toBe("https://indycardexchange.com/");
    expect(summary.averageRating).toBe(8.8);
    expect(summary.visitCount).toBe(3);
  });
});

describe("getAllLcsSummaries", () => {
  it("groups by lcsId and sorts by latest post date descending", async () => {
    const posts = [
      {
        slug: "indy-early",
        title: "Indy Early",
        url: "/shaolin/indy-early",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", rating: "8.7" }}>Visit</ReleaseSection>`,
        },
      },
      {
        slug: "iconic-late",
        title: "Iconic Late",
        url: "/shaolin/iconic-late",
        date: "2026-02-17",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "iconic-sports-cards", name: "Iconic Sports Cards", rating: "8.5/10" }}>Visit</ReleaseSection>`,
        },
      },
      {
        slug: "indy-late",
        title: "Indy Late",
        url: "/shaolin/indy-late",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", rating: "8.9/10" }}>Visit</ReleaseSection>`,
        },
      },
    ];

    const summaries = await getAllLcsSummaries(posts);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.lcsId).toBe("iconic-sports-cards");
    expect(summaries[0]?.lcsName).toBe("Iconic Sports Cards");
    expect(summaries[0]?.averageRating).toBe(8.5);
    expect(summaries[0]?.visitCount).toBe(1);
    expect(summaries[1]?.lcsId).toBe("indy-card-exchange");
    expect(summaries[1]?.lcsName).toBe("Indy Card Exchange");
    expect(summaries[1]?.averageRating).toBe(8.8);
    expect(summaries[1]?.visitCount).toBe(2);
    expect(summaries[1]?.latestPostDate).toBe("2026-02-16");
  });
});

describe("getLcsPageData", () => {
  it("returns normalized page data for existing lcs ids", async () => {
    const posts = [
      {
        slug: "indy",
        title: "Indy",
        url: "/shaolin/indy",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "indy-card-exchange", name: "Indy Card Exchange", url: "https://indycardexchange.com/", rating: "8.7/10" }}>Visit</ReleaseSection>`,
        },
      },
    ];

    const data = await getLcsPageData("indy-card-exchange", posts);

    expect(data).not.toBeNull();
    expect(data?.lcsId).toBe("indy-card-exchange");
    expect(data?.lcsName).toBe("Indy Card Exchange");
    expect(data?.lcsUrl).toBe("https://indycardexchange.com/");
    expect(data?.summary.averageRating).toBe(8.7);
    expect(data?.summary.visitCount).toBe(1);
    expect(data?.sections).toHaveLength(1);
  });

  it("returns null when no sections exist for the id", async () => {
    const data = await getLcsPageData("404", []);
    expect(data).toBeNull();
  });
});
