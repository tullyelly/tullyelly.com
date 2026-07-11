jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({ allPosts: [] }));

import {
  extractReleaseSections,
  getAlterEgoReleaseEntries,
  getLandingReleaseEntries,
  getReleasePageDateRange,
  normalizeReleasePage,
  normalizeReleaseOrder,
  orderReleaseEntries,
  paginateReleaseEntries,
  releaseSectionPreview,
  type ReleasePostSource,
} from "@/lib/alter-ego-release-content";

const post = (
  slug: string,
  date: string,
  raw: string,
  options: Partial<ReleasePostSource> = {},
): ReleasePostSource => ({
  body: { raw },
  slug,
  url: `/shaolin/${slug}`,
  date,
  title: `Post ${slug}`,
  tags: ["tag-one"],
  ...options,
});

describe("alter ego release content", () => {
  it("extracts a complete matching section without requiring releaseId", () => {
    const mdx = '<ReleaseSection alterEgo="mark2">\nHello **world**.\n</ReleaseSection>';
    expect(extractReleaseSections(mdx)).toEqual([
      expect.objectContaining({ alterEgo: "mark2", mdx, bodyMdx: "\nHello **world**.\n", sectionOrdinal: 1, totalSections: 1, offset: 0 }),
    ]);
  });

  it("extracts multiple sections and preserves ordinal and total", () => {
    const sections = extractReleaseSections([
      '<ReleaseSection alterEgo="mark2">One</ReleaseSection>',
      '<ReleaseSection alterEgo="cardattack">Two</ReleaseSection>',
      '<ReleaseSection alterEgo="mark2">Three</ReleaseSection>',
    ].join("\n"));
    expect(sections.map(({ alterEgo, sectionOrdinal, totalSections }) => ({ alterEgo, sectionOrdinal, totalSections }))).toEqual([
      { alterEgo: "mark2", sectionOrdinal: 1, totalSections: 3 },
      { alterEgo: "cardattack", sectionOrdinal: 2, totalSections: 3 },
      { alterEgo: "mark2", sectionOrdinal: 3, totalSections: 3 },
    ]);
  });

  it("supports multiline tags and Contentlayer literal attribute syntax", () => {
    const sections = extractReleaseSections(`<ReleaseSection\n  divider={true}\n  alterEgo={'unclejimmy'}\n>Body</ReleaseSection>`);
    expect(sections[0]).toMatchObject({ alterEgo: "unclejimmy", bodyMdx: "Body" });
  });

  it("ignores examples in fenced code blocks", () => {
    const raw = ['```mdx', '<ReleaseSection alterEgo="mark2">Fake</ReleaseSection>', '```', '<ReleaseSection alterEgo="mark2">Real</ReleaseSection>'].join("\n");
    expect(extractReleaseSections(raw).map((section) => section.bodyMdx)).toEqual(["Real"]);
  });

  it("handles incomplete sections consistently without returning partial MDX", () => {
    expect(extractReleaseSections('<ReleaseSection alterEgo="mark2">unfinished')).toEqual([]);
  });

  it("filters by alter ego and excludes drafts", () => {
    const posts = [
      post("published", "2026-01-01", '<ReleaseSection alterEgo="mark2">Keep</ReleaseSection><ReleaseSection alterEgo="george">Skip</ReleaseSection>'),
      post("draft", "2026-02-01", '<ReleaseSection alterEgo="mark2">Draft</ReleaseSection>', { draft: true }),
    ];
    expect(getAlterEgoReleaseEntries("mark2", posts).map((entry) => entry.bodyMdx)).toEqual(["Keep"]);
  });

  it("sorts newest posts first and later same-post sections first", () => {
    const entries = getAlterEgoReleaseEntries("mark2", [
      post("old", "2025-01-01", '<ReleaseSection alterEgo="mark2">Old</ReleaseSection>'),
      post("new", "2026-01-01", '<ReleaseSection alterEgo="mark2">First</ReleaseSection><ReleaseSection alterEgo="mark2">Second</ReleaseSection>'),
    ]);
    expect(entries.map((entry) => entry.bodyMdx)).toEqual(["Second", "First", "Old"]);
  });

  it("limits landing results to ten", () => {
    const raw = Array.from({ length: 12 }, (_, index) => `<ReleaseSection alterEgo="mark2">${index}</ReleaseSection>`).join("\n");
    expect(getLandingReleaseEntries("mark2", [post("many", "2026-01-01", raw)])).toHaveLength(10);
  });

  it("paginates twenty entries and keeps a final partial page", () => {
    const raw = Array.from({ length: 25 }, (_, index) => `<ReleaseSection alterEgo="mark2">${index}</ReleaseSection>`).join("\n");
    const entries = getAlterEgoReleaseEntries("mark2", [post("many", "2026-01-01", raw)]);
    expect(paginateReleaseEntries(entries, 1)).toMatchObject({ total: 25, pageCount: 2, outOfRange: false });
    expect(paginateReleaseEntries(entries, 1).entries).toHaveLength(20);
    expect(paginateReleaseEntries(entries, 2).entries).toHaveLength(5);
    expect(paginateReleaseEntries(entries, 3)).toMatchObject({ entries: [], outOfRange: true });
  });

  it("reports the chronological date range represented by the current page", () => {
    const entries = getAlterEgoReleaseEntries("mark2", [
      post("older", "2026-06-30", '<ReleaseSection alterEgo="mark2">Older</ReleaseSection>'),
      post("newer", "2026-07-08", '<ReleaseSection alterEgo="mark2">Newer</ReleaseSection>'),
    ]);
    expect(getReleasePageDateRange(entries)).toEqual({ start: "2026-06-30", end: "2026-07-08" });
    expect(getReleasePageDateRange([])).toBeNull();
  });

  it("normalizes missing and invalid page values", () => {
    expect(normalizeReleasePage(undefined)).toBe(1);
    expect(normalizeReleasePage("garbage")).toBe(1);
    expect(normalizeReleasePage("0")).toBe(1);
    expect(normalizeReleasePage(["2", "3"])).toBe(2);
  });

  it("normalizes and applies chronological ordering", () => {
    expect(normalizeReleaseOrder(undefined)).toBe("newest");
    expect(normalizeReleaseOrder("anything")).toBe("newest");
    expect(normalizeReleaseOrder("oldest")).toBe("oldest");
    const entries = getAlterEgoReleaseEntries("mark2", [
      post("old", "2025-01-01", '<ReleaseSection alterEgo="mark2">Old</ReleaseSection>'),
      post("new", "2026-01-01", '<ReleaseSection alterEgo="mark2">New</ReleaseSection>'),
    ]);
    expect(orderReleaseEntries(entries, "oldest").map((entry) => entry.bodyMdx)).toEqual(["Old", "New"]);
  });

  it("creates readable previews and adds an ellipsis only when truncated", () => {
    const source = '![alt](/image.webp) Hello **bold** [friend](https://example.com) <PersonTag tag="wu" /> `code`';
    expect(releaseSectionPreview(source, 200)).toBe("Hello bold friend code");
    expect(releaseSectionPreview("one two three four five", 12)).toBe("one two…");
  });
});
