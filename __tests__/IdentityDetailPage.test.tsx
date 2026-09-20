import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

jest.mock("@/lib/identity-server", () => ({
  getIdentityBySlug: async () => ({
    id: 1,
    slug: "eeeeeeeeemma",
    displayName: "eeeeeeeeemma",
    href: "/unclejimmy/fam/eeeeeeeeemma",
    metadata: { kind: "person", contexts: {} },
    meta: {},
  }),
  getIdentityHref: () => null,
  listGroupMembers: async () => [],
  listIdentityGroups: async () => [],
}));

jest.mock("@/lib/blog", () => ({
  getTaggedPosts: () => [],
}));

jest.mock("@/components/unclejimmy/SquadMemberPosts", () => ({
  __esModule: true,
  default: () => null,
}));

import IdentityDetailPage from "@/components/identity/IdentityDetailPage";

describe("IdentityDetailPage", () => {
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
});
