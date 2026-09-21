jest.mock("contentlayer/generated", () => ({
  allPosts: [
    {
      slug: "direct-and-clan",
      title: "Direct and clan",
      summary: "Matches both tags but should appear once.",
      date: "2026-06-02",
      url: "/shaolin/direct-and-clan",
      tags: ["freak", "bucks-n-six"],
      draft: false,
    },
    {
      slug: "clan-only",
      title: "Clan only",
      summary: "Inherited from the clan.",
      date: "2026-06-01",
      url: "/shaolin/clan-only",
      tags: ["BUCKS-N-SIX"],
      draft: false,
    },
    {
      slug: "draft-clan-post",
      title: "Draft clan post",
      summary: "Should stay hidden.",
      date: "2026-06-03",
      url: "/shaolin/draft-clan-post",
      tags: ["bucks-n-six"],
      draft: true,
    },
  ],
}));

import { getTaggedPostsForTags } from "@/lib/blog";

describe("inherited Chronicle tags", () => {
  it("merges direct and clan tags without duplicates and excludes drafts", () => {
    expect(getTaggedPostsForTags(["freak", "bucks-n-six", " FREAK "])).toEqual([
      expect.objectContaining({ slug: "direct-and-clan" }),
      expect.objectContaining({ slug: "clan-only" }),
    ]);
  });
});
