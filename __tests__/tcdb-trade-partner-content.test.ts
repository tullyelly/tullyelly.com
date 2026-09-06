jest.mock("contentlayer/generated", () => ({ allPosts: [
  { slug: "both", title: "Both", summary: "", date: "2026-02-01", url: "/shaolin/both", tags: ["bucks"], draft: false, body: { raw: '<ReleaseSection tcdbTradeId="123">Trade</ReleaseSection>' } },
  { slug: "tag", title: "Tag", summary: "", date: "2026-01-01", url: "/shaolin/tag", tags: ["bucks"], draft: false, body: { raw: "" } },
] }));

import { getRelatedTradePartnerChronicles } from "@/lib/tcdb-trade-partner-content";

it("deduplicates Chronicles while retaining trade and explicit tag reasons", () => {
  const posts = getRelatedTradePartnerChronicles(["123"], [{ id: 1, slug: "bucks", displayName: "Bucks", hrefKind: "tag", sourceType: "clan", sourceId: 9 }]);
  expect(posts.map((post) => post.slug)).toEqual(["both", "tag"]);
  expect(posts[0].reasons).toEqual(["trade", "clan"]);
});
