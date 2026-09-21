import { render, screen } from "@testing-library/react";

const mockGetIdentityBySlug = jest.fn();
const mockGetIdentityHref = jest.fn();
const mockGetTaggedPostsForTags = jest.fn();
const mockListGroupMembers = jest.fn();
const mockListIdentityAncestorGroups = jest.fn();
const mockListIdentityDescendants = jest.fn();
const mockListIdentityGroups = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/lib/identity-server", () => ({
  getIdentityBySlug: (...args: unknown[]) => mockGetIdentityBySlug(...args),
  getIdentityHref: (...args: unknown[]) => mockGetIdentityHref(...args),
  listGroupMembers: (...args: unknown[]) => mockListGroupMembers(...args),
  listIdentityAncestorGroups: (...args: unknown[]) =>
    mockListIdentityAncestorGroups(...args),
  listIdentityDescendants: (...args: unknown[]) =>
    mockListIdentityDescendants(...args),
  listIdentityGroups: (...args: unknown[]) => mockListIdentityGroups(...args),
}));

jest.mock("@/lib/blog", () => ({
  getTaggedPostsForTags: (...args: unknown[]) =>
    mockGetTaggedPostsForTags(...args),
}));

jest.mock("@/components/unclejimmy/SquadMemberPosts", () => ({
  __esModule: true,
  default: () => null,
}));

import IdentityDetailPage from "@/components/identity/IdentityDetailPage";

describe("IdentityDetailPage", () => {
  beforeEach(() => {
    mockGetIdentityBySlug.mockReset().mockResolvedValue({
      id: 1,
      slug: "eeeeeeeeemma",
      displayName: "eeeeeeeeemma",
      href: "/unclejimmy/fam/eeeeeeeeemma",
      metadata: { kind: "person", contexts: {} },
      meta: {},
    });
    mockGetIdentityHref.mockReset().mockReturnValue(null);
    mockGetTaggedPostsForTags.mockReset().mockReturnValue([]);
    mockListGroupMembers.mockReset().mockResolvedValue([]);
    mockListIdentityAncestorGroups.mockReset().mockResolvedValue([]);
    mockListIdentityDescendants.mockReset().mockResolvedValue([]);
    mockListIdentityGroups.mockReset().mockResolvedValue([]);
  });

  it("uses the route's explicit directory label without guessing plurality", async () => {
    render(
      await IdentityDetailPage({
        slug: "eeeeeeeeemma",
        context: "unclejimmy",
        kind: "person",
        noun: "Fam",
        directoryHref: "/unclejimmy/fam",
        directoryLabel: "Fam",
      }),
    );

    expect(screen.getByRole("link", { name: "Back to Fam" })).toHaveAttribute(
      "href",
      "/unclejimmy/fam",
    );
    expect(
      screen.queryByRole("link", { name: "Back to Fams" }),
    ).not.toBeInTheDocument();
  });

  it("shows a clan's parent membership only when it is recorded", async () => {
    mockGetIdentityBySlug.mockResolvedValue({
      id: 2,
      slug: "method-man-and-redman",
      displayName: "Method Man and Redman",
      href: "/theabbott/clans/method-man-and-redman",
      metadata: { kind: "group", contexts: {} },
      meta: {},
    });
    mockListIdentityGroups.mockResolvedValue([
      {
        id: 3,
        slug: "wu-tang-clan",
        displayName: "Wu-Tang Clan",
        href: "/theabbott/clans/wu-tang-clan",
        metadata: { kind: "group", contexts: {} },
        meta: {},
      },
    ]);
    mockGetIdentityHref.mockReturnValue("/theabbott/clans/wu-tang-clan");

    render(
      await IdentityDetailPage({
        slug: "method-man-and-redman",
        context: "theabbott",
        kind: "group",
        noun: "Clan",
        directoryHref: "/theabbott/clans",
        directoryLabel: "Clans",
      }),
    );

    const membershipHeading = screen.getByRole("heading", {
      name: "Member of",
    });
    const membershipCard = membershipHeading.closest("section");
    expect(membershipHeading).toHaveClass("!m-0");
    expect(membershipCard).toHaveClass("p-4");
    expect(membershipCard?.querySelector("ul")).toHaveClass(
      "mt-3",
      "sm:grid-cols-2",
    );
    expect(screen.getByRole("link", { name: "Wu-Tang Clan" })).toHaveAttribute(
      "href",
      "/theabbott/clans/wu-tang-clan",
    );
    expect(
      screen.queryByRole("heading", { name: "Members" }),
    ).not.toBeInTheDocument();
  });

  it("includes Fam Chronicles on their Squad detail", async () => {
    mockGetIdentityBySlug.mockResolvedValue({
      id: 2,
      slug: "nuclear",
      displayName: "nuclear reactor",
      href: "/unclejimmy/squads/nuclear",
      metadata: { kind: "group", contexts: {} },
      meta: {},
    });
    mockListIdentityDescendants.mockResolvedValue([
      {
        id: 3,
        slug: "bonnibel",
        displayName: "bonnibel",
        href: "/unclejimmy/fam/bonnibel",
        metadata: { kind: "person", contexts: {} },
        meta: {},
      },
      {
        id: 4,
        slug: "child-squad",
        displayName: "Child Squad",
        href: "/unclejimmy/squads/child-squad",
        metadata: { kind: "group", contexts: {} },
        meta: {},
      },
    ]);

    render(
      await IdentityDetailPage({
        slug: "nuclear",
        context: "unclejimmy",
        kind: "group",
        noun: "Squad",
        directoryHref: "/unclejimmy/squads",
        directoryLabel: "Squads",
      }),
    );

    expect(mockListIdentityDescendants).toHaveBeenCalledWith("nuclear");
    expect(mockGetTaggedPostsForTags).toHaveBeenCalledWith([
      "nuclear",
      "bonnibel",
    ]);
  });
});
