import type { NavItem } from "@/types/nav";

const mockGetMenu = jest.fn();
const mockGetPublishedPosts = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/menu/getMenu", () => ({
  getMenu: (...args: unknown[]) => mockGetMenu(...args),
}));
jest.mock("@/lib/blog", () => ({
  getPublishedPosts: (...args: unknown[]) => mockGetPublishedPosts(...args),
}));

import {
  rankSiteSearchDocuments,
  searchSite,
  type SiteSearchDocument,
} from "@/lib/search/site-search";

const menuTree: NavItem[] = [
  {
    id: "persona.cardattack",
    kind: "persona",
    persona: "cardattack",
    label: "CardAttack",
    children: [
      {
        id: "page.clans",
        kind: "link",
        label: "Clans",
        href: "/cardattack/clans",
        keywords: ["teams"],
      },
    ],
  },
];

function post(overrides: Record<string, unknown> = {}) {
  return {
    title: "Collecting Stories",
    summary: "Notes from a lifetime of collecting cards.",
    tags: ["cards", "memories"],
    slug: "collecting-stories",
    url: "/shaolin/collecting-stories",
    resolvedAlterEgo: "cardattack",
    draft: false,
    ...overrides,
  };
}

describe("site search", () => {
  beforeEach(() => {
    mockGetMenu.mockReset().mockResolvedValue({ tree: menuTree, index: {} });
    mockGetPublishedPosts.mockReset().mockReturnValue([post()]);
  });

  it("matches capability-filtered menu pages without exposing absent entries", async () => {
    expect(await searchSite("clans")).toEqual([
      expect.objectContaining({
        type: "page",
        title: "Clans",
        href: "/cardattack/clans",
      }),
    ]);
    expect(await searchSite("admin")).toEqual([]);
    expect(mockGetMenu).toHaveBeenCalled();
  });

  it.each([
    ["Collecting Stories", "title"],
    ["lifetime", "summary"],
    ["memories", "tag"],
  ])("matches a Chronicle by %s (%s)", async (query) => {
    expect(await searchSite(query)).toEqual([
      expect.objectContaining({
        type: "chronicle",
        href: "/shaolin/collecting-stories",
      }),
    ]);
  });

  it("defensively excludes draft Chronicles", async () => {
    mockGetPublishedPosts.mockReturnValue([
      post({ title: "Secret Draft", draft: true }),
    ]);
    expect(await searchSite("Secret Draft")).toEqual([]);
  });

  it("ranks exact title matches above weaker matches", () => {
    const documents: SiteSearchDocument[] = [
      {
        type: "chronicle",
        title: "Another entry",
        href: "/summary-match",
        description: "The search target appears here.",
        keywords: [],
      },
      {
        type: "page",
        title: "search target",
        href: "/title-match",
        description: "",
        keywords: [],
      },
    ];

    expect(
      rankSiteSearchDocuments(documents, " search   target ")[0].href,
    ).toBe("/title-match");
  });

  it("deduplicates canonical hrefs and applies the requested limit", () => {
    const documents: SiteSearchDocument[] = Array.from(
      { length: 5 },
      (_, index) => ({
        type: "page" as const,
        title: `Match ${index}`,
        href: index < 2 ? "/same" : `/match-${index}`,
        description: "",
        keywords: ["match"],
      }),
    );

    const results = rankSiteSearchDocuments(documents, "match", 4);
    expect(results).toHaveLength(4);
    expect(results.filter((result) => result.href === "/same")).toHaveLength(1);
  });

  it("returns no results for an empty query without loading sources", async () => {
    expect(await searchSite("   ")).toEqual([]);
    expect(mockGetMenu).not.toHaveBeenCalled();
    expect(mockGetPublishedPosts).not.toHaveBeenCalled();
  });
});
