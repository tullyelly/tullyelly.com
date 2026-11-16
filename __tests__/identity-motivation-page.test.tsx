import { render, screen } from "@testing-library/react";
const mockIdentity = jest.fn(),
  mockPosts = jest.fn();
jest.mock("@/lib/identity-server", () => ({
  getIdentityBySlug: (...args: unknown[]) => mockIdentity(...args),
  getIdentityHref: () => null,
  listIdentityAncestorGroups: async () => [
    {
      id: 50,
      slug: "g-league",
      displayName: "g-league",
      href: null,
      meta: {},
      metadata: { kind: "group", contexts: {} },
    },
  ],
  listIdentityGroups: async () => [],
  listGroupMembers: async () => [],
  listIdentityDescendants: async () => [],
}));
jest.mock("@/lib/identity-chronicles", () => ({
  getIdentityTaggedPosts: (...args: unknown[]) => mockPosts(...args),
}));
jest.mock("@/components/identity/CollectionRelationships", () => ({
  __esModule: true,
  default: ({ displayName, mode }: { displayName: string; mode: string }) => (
    <div data-testid="relationship-section">
      {mode}:{displayName}
    </div>
  ),
}));
import IdentityDetailPage from "@/components/identity/IdentityDetailPage";
beforeEach(() => {
  mockIdentity.mockReset();
  mockPosts.mockReset().mockResolvedValue([
    {
      slug: "family-note",
      title: "Family Chronicle",
      url: "/shaolin/family-note",
      summary: "Family",
      date: "2026-11-15",
      tags: ["lulu"],
    },
  ]);
});
test.each(["lulu", "cal", "the-lazer"])(
  "%s Fam retains its own and real membership feed beside the separate section",
  async (slug) => {
    mockIdentity.mockResolvedValue({
      id: 1,
      slug,
      displayName: slug,
      href: `/unclejimmy/fam/${slug}`,
      meta: {},
      metadata: { kind: "person", contexts: { unclejimmy: { role: "fam" } } },
    });
    render(
      await IdentityDetailPage({
        slug,
        context: "unclejimmy",
        kind: "person",
        noun: "Fam",
        directoryHref: "/unclejimmy/fam",
        directoryLabel: "Fam",
      }),
    );
    expect(mockPosts).toHaveBeenCalledWith([slug, "g-league"]);
    expect(screen.getByTestId("relationship-section")).toHaveTextContent(
      `person:${slug}`,
    );
    expect(
      screen.getByRole("link", { name: "Family Chronicle" }),
    ).toHaveAttribute("href", "/shaolin/family-note");
    expect(
      screen.queryByText(/king-james|eldrid|lazer-face/),
    ).not.toBeInTheDocument();
  },
);
