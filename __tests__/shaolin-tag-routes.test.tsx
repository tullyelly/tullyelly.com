import { render, screen, within } from "@testing-library/react";

const getPublishedPostsMock = jest.fn();
const getTagMetadataBatchMock = jest.fn();
const notFoundMock = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

jest.mock("contentlayer/generated", () => ({ allPosts: [] }));

jest.mock("@/lib/blog", () => ({
  getPublishedPosts: () => getPublishedPostsMock(),
  getTagsWithCounts: (posts: Array<{ tags?: string[] }>) =>
    posts.reduce<Record<string, number>>((counts, post) => {
      for (const tag of post.tags ?? [])
        counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] ?? 0) + 1;
      return counts;
    }, {}),
}));

jest.mock("@/lib/tags-server", () => ({
  getTagMetadataBatch: (...args: unknown[]) => getTagMetadataBatchMock(...args),
}));

jest.mock("@/lib/chronicle-person-tags", () => ({
  listChroniclePersonTagDisplayNames: (slug: string) =>
    slug === "doom"
      ? [
          { displayName: "Metal Face", count: 4, chronicleCount: 2 },
          { displayName: "Viktor Vaughn", count: 2, chronicleCount: 1 },
        ]
      : [],
}));

jest.mock("@/app/shaolin/_components/ChronicleListClient", () => ({
  __esModule: true,
  default: ({ rows }: { rows: Array<{ title: string }> }) => (
    <div data-testid="chronicle-list">
      {rows.map((row) => row.title).join(",")}
    </div>
  ),
}));

jest.mock("@/components/chronicles/TagCommentsSection", () => ({
  TagCommentsSection: ({ tag }: { tag: string }) => (
    <div data-testid="tag-comments">Comments for {tag}</div>
  ),
}));

import TagDirectoryPage from "@/app/shaolin/tags/page";
import TagDetailPage from "@/app/shaolin/tags/[tag]/page";

const posts = [
  {
    slug: "matching",
    url: "/shaolin/matching",
    title: "Matching Chronicle",
    summary: "Matches the requested tag",
    date: "2026-09-02",
    resolvedAlterEgo: "mark2",
    tags: ["builds", "DOOM"],
    infinityStone: true,
  },
  {
    slug: "other",
    url: "/shaolin/other",
    title: "Other Chronicle",
    summary: "Does not match",
    date: "2026-09-01",
    resolvedAlterEgo: "cardattack",
    tags: ["cards", "DOOM"],
    infinityStone: false,
  },
];

describe("Shaolin tag routes", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
    getTagMetadataBatchMock.mockReset();
    notFoundMock.mockClear();
    getPublishedPostsMock.mockReturnValue(posts);
    getTagMetadataBatchMock.mockImplementation(
      async (tags: string[]) =>
        new Map(
          tags.map((slug) => [
            slug,
            {
              slug,
              displayName: slug === "doom" ? "DOOM" : slug,
              href:
                slug === "builds" ? "/mark2/builds" : `/shaolin/tags/${slug}`,
              hrefKind: slug === "builds" ? "custom" : "tag",
              isClickable: true,
            },
          ]),
        ),
    );
  });

  it("renders the modern Chronicle tag directory from published Chronicle tags", async () => {
    render(await TagDirectoryPage());

    expect(
      screen.getByRole("heading", { name: "Chronicle tags", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tag directory" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search Chronicle tags" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "#doom" })).toHaveLength(2);
    const doomRow = screen
      .getAllByRole("link", { name: "#doom" })
      .map((link) => link.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(doomRow).not.toBeNull();
    expect(within(doomRow as HTMLElement).getByText("2")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Related page" })).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole("link", { name: "Related page" })[0],
    ).toHaveAttribute("href", "/mark2/builds");
    expect(screen.getAllByText("Metal Face (4)")).toHaveLength(2);
    expect(screen.getAllByText("Viktor Vaughn (2)")).toHaveLength(2);
  });

  it("labels persona-kind destinations as alter ego pages", async () => {
    getTagMetadataBatchMock.mockImplementation(
      async (tags: string[]) =>
        new Map(
          tags.map((slug) => [
            slug,
            {
              slug,
              displayName: slug,
              href: slug === "doom" ? "/theabbott" : `/shaolin/tags/${slug}`,
              hrefKind: slug === "doom" ? "persona" : "tag",
              isClickable: true,
            },
          ]),
        ),
    );

    render(await TagDirectoryPage());

    const links = screen.getAllByRole("link", { name: "Alter ego page" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/theabbott");
    expect(
      screen.queryByRole("link", { name: "Persona page" }),
    ).not.toBeInTheDocument();
  });

  it("labels resolved Uncle Jimmy person routes as Fam pages", async () => {
    getTagMetadataBatchMock.mockImplementation(
      async (tags: string[]) =>
        new Map(
          tags.map((slug) => [
            slug,
            {
              slug,
              displayName: slug,
              href:
                slug === "doom"
                  ? "/unclejimmy/fam/doom"
                  : `/shaolin/tags/${slug}`,
              hrefKind: slug === "doom" ? "squad" : "tag",
              isClickable: true,
            },
          ]),
        ),
    );

    render(await TagDirectoryPage());

    const links = screen.getAllByRole("link", { name: "Fam page" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/unclejimmy/fam/doom");
    expect(
      screen.queryByRole("link", { name: "Squad page" }),
    ).not.toBeInTheDocument();
  });

  it("passes only matching Chronicles to the standardized Chronicle list", async () => {
    render(await TagDetailPage({ params: Promise.resolve({ tag: "builds" }) }));

    expect(
      screen.getByRole("heading", { name: "#builds", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("chronicle-list")).toHaveTextContent(
      "Matching Chronicle",
    );
    expect(screen.getByTestId("chronicle-list")).not.toHaveTextContent(
      "Other Chronicle",
    );
  });

  it("uses the route-local not-found boundary for a missing tag", async () => {
    await expect(
      TagDetailPage({ params: Promise.resolve({ tag: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
