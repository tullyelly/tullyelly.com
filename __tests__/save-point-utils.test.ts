jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

import {
  extractSavePointSectionsWithOffsets,
  getAllSavePointSummaries,
  getSavePointIdAttribute,
  getSavePointPageData,
  getSavePointSections,
  summarizeSavePointSections,
} from "@/lib/save-point";

describe("getSavePointIdAttribute", () => {
  it("returns the normalized save point id attribute format", () => {
    expect(getSavePointIdAttribute(" mewgenics ")).toBe(
      'review={{ type: "save-point", id: "mewgenics" }}',
    );
  });
});

describe("extractSavePointSectionsWithOffsets", () => {
  it("extracts sections with review objects and ignores non save-point reviews", () => {
    const blockA = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", url: "https://mewgenics.example.com", rating: "9.5/10" }}>\n  Day one\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="unclejimmy" review={{ type: 'save-point', id: "chrono-trigger", name: 'Chrono Trigger', rating: '10/10' }}>\n  Day two\n</ReleaseSection>`;
    const blockC = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.0/10" }}>\n  Day three\n</ReleaseSection>`;
    const blockD = `<ReleaseSection alterEgo="cardattack" review={{ type: "lcs", id: "iconic-sports-cards", name: "Iconic Sports Cards", rating: "8.5" }}>\n  Skip\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}\n\n${blockC}\n\n${blockD}`;

    const sections = extractSavePointSectionsWithOffsets(raw, "mewgenics");

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toBe(blockA);
    expect(sections[0]?.savePointName).toBe("Mewgenics");
    expect(sections[0]?.savePointUrl).toBe("https://mewgenics.example.com");
    expect(sections[0]?.savePointRating).toBe("9.5/10");
    expect(sections[1]?.mdx).toBe(blockC);
    expect(sections[1]?.savePointId).toBe("mewgenics");
  });

  it("ignores save-point examples inside fenced code blocks", () => {
    const exampleInFence = [
      "```mdx",
      '<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.5/10" }}>',
      "  Example only",
      "</ReleaseSection>",
      "```",
    ].join("\n");
    const realBlock = `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.7/10" }}>\n  Real review\n</ReleaseSection>`;
    const raw = `${exampleInFence}\n\n${realBlock}`;

    const sections = extractSavePointSectionsWithOffsets(raw, "mewgenics");

    expect(sections).toHaveLength(1);
    expect(sections[0]?.mdx).toBe(realBlock);
    expect(sections[0]?.savePointRating).toBe("9.7/10");
  });
});

describe("getSavePointSections", () => {
  it("orders extracted sections by post date ascending", () => {
    const posts = [
      {
        slug: "later-review",
        title: "Later Review",
        url: "/shaolin/later-review",
        date: "2026-03-03",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.7/10" }}>Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-review",
        title: "Earlier Review",
        url: "/shaolin/earlier-review",
        date: "2026-03-02",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.5/10" }}>Earlier</ReleaseSection>`,
        },
      },
    ];

    const sections = getSavePointSections("mewgenics", posts);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.postSlug).toBe("earlier-review");
    expect(sections[1]?.postSlug).toBe("later-review");
  });
});

describe("summarizeSavePointSections", () => {
  it("parses numeric ratings, ignores invalid ratings, and rounds to one decimal", () => {
    const sections = [
      {
        savePointId: "mewgenics",
        postSlug: "a",
        postUrl: "/shaolin/a",
        postDate: "2026-03-02",
        postTitle: "A",
        savePointName: "Mewgenics",
        savePointUrl: "https://mewgenics.example.com",
        savePointRating: "9.5",
        mdx: "<ReleaseSection />",
      },
      {
        savePointId: "mewgenics",
        postSlug: "b",
        postUrl: "/shaolin/b",
        postDate: "2026-03-03",
        postTitle: "B",
        savePointName: "Mewgenics",
        savePointUrl: "https://mewgenics.example.com",
        savePointRating: "9.7/10",
        mdx: "<ReleaseSection />",
      },
      {
        savePointId: "mewgenics",
        postSlug: "c",
        postUrl: "/shaolin/c",
        postDate: "2026-03-04",
        postTitle: "C",
        savePointName: "Mewgenics",
        savePointUrl: "https://mewgenics.example.com",
        savePointRating: "unknown",
        mdx: "<ReleaseSection />",
      },
    ];

    const summary = summarizeSavePointSections(sections);

    expect(summary.savePointName).toBe("Mewgenics");
    expect(summary.savePointUrl).toBe("https://mewgenics.example.com");
    expect(summary.averageRating).toBe(9.6);
    expect(summary.visitCount).toBe(3);
  });
});

describe("getAllSavePointSummaries", () => {
  it("groups by savePointId and sorts by latest post date descending", () => {
    const posts = [
      {
        slug: "mew-early",
        title: "Mew Early",
        url: "/shaolin/mew-early",
        date: "2026-03-02",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", rating: "9.5" }}>Review</ReleaseSection>`,
        },
      },
      {
        slug: "chrono-late",
        title: "Chrono Late",
        url: "/shaolin/chrono-late",
        date: "2026-03-05",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "chrono-trigger", name: "Chrono Trigger", url: "https://chronotrigger.example.com", rating: "10/10" }}>Review</ReleaseSection>`,
        },
      },
      {
        slug: "mew-late",
        title: "Mew Late",
        url: "/shaolin/mew-late",
        date: "2026-03-04",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", rating: "9.7/10" }}>Review</ReleaseSection>`,
        },
      },
    ];

    const summaries = getAllSavePointSummaries(posts);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.savePointId).toBe("chrono-trigger");
    expect(summaries[0]?.savePointName).toBe("Chrono Trigger");
    expect(summaries[0]?.savePointUrl).toBe("https://chronotrigger.example.com");
    expect(summaries[0]?.averageRating).toBe(10);
    expect(summaries[0]?.visitCount).toBe(1);
    expect(summaries[1]?.savePointId).toBe("mewgenics");
    expect(summaries[1]?.savePointName).toBe("Mewgenics");
    expect(summaries[1]?.averageRating).toBe(9.6);
    expect(summaries[1]?.visitCount).toBe(2);
    expect(summaries[1]?.latestPostDate).toBe("2026-03-04");
  });
});

describe("getSavePointPageData", () => {
  it("returns normalized page data for existing save point ids", () => {
    const posts = [
      {
        slug: "mewgenics",
        title: "Mewgenics",
        url: "/shaolin/mewgenics",
        date: "2026-03-03",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" review={{ type: "save-point", id: "mewgenics", name: "Mewgenics", url: "https://mewgenics.example.com", rating: "9.5/10" }}>Review</ReleaseSection>`,
        },
      },
    ];

    const data = getSavePointPageData("mewgenics", posts);

    expect(data).not.toBeNull();
    expect(data?.savePointId).toBe("mewgenics");
    expect(data?.savePointName).toBe("Mewgenics");
    expect(data?.savePointUrl).toBe("https://mewgenics.example.com");
    expect(data?.summary.averageRating).toBe(9.5);
    expect(data?.summary.visitCount).toBe(1);
    expect(data?.sections).toHaveLength(1);
  });

  it("returns null when no sections exist for the id", () => {
    const data = getSavePointPageData("404", []);
    expect(data).toBeNull();
  });
});
