import { render, screen } from "@testing-library/react";
import IdentityMusic from "@/components/theabbott/IdentityMusic";
jest.mock("contentlayer/generated", () => ({
  allPosts: [
    {
      title: "Original",
      url: "/shaolin/original",
      date: "2026-11-28",
      resolvedAlterEgo: "theabbott",
      musicUsages: [
        { type: "video", artistTag: "aesop", id: "one" },
        { type: "playlist", artistTag: "other", id: "two" },
      ],
    },
    {
      title: "Draft",
      url: "/shaolin/draft",
      date: "2026-11-28",
      draft: true,
      resolvedAlterEgo: "theabbott",
      musicUsages: [{ type: "video", artistTag: "aesop", id: "hidden" }],
    },
  ],
}));
jest.mock("@/lib/tag-aliases-server", () => ({
  getTagAliasSnapshot: async () => new Map([["aesop", "aesop-rock"]]),
}));
jest.mock("@/lib/tags-server", () => ({
  getTagMetadataBatch: async () =>
    new Map([["aesop", { displayName: "Aesop Rock" }]]),
}));
test("artist music follows canonical aliases and retains source and fallback title", async () => {
  render(await IdentityMusic({ slug: "aesop-rock" }));
  expect(screen.getByRole("heading", { name: "Aesop Rock" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Original" })).toHaveAttribute(
    "href",
    expect.stringContaining("/shaolin/original?returnTo="),
  );
  expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  expect(screen.getByText("1 appearance")).toBeVisible();
});
