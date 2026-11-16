const mockAliasSql = jest.fn();
jest.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => mockAliasSql(...args),
}));
jest.mock("contentlayer/generated", () => ({
  allPosts: [
    {
      slug: "one",
      url: "/shaolin/one",
      title: "one",
      date: "2026-11-15",
      tags: ["king-james", "lebron-james"],
    },
    {
      slug: "two",
      url: "/shaolin/two",
      title: "two",
      date: "2026-11-14",
      tags: ["lebron-james"],
    },
    {
      slug: "family",
      url: "/shaolin/family",
      title: "family",
      date: "2026-11-13",
      tags: ["cal"],
    },
    {
      slug: "athlete",
      url: "/shaolin/athlete",
      title: "athlete",
      date: "2026-11-12",
      tags: ["eldrid"],
    },
  ],
}));
import { getIdentityTaggedPosts } from "@/lib/identity-chronicles";
import { getPublishedPosts, getTagsWithCounts } from "@/lib/blog";
import {
  collectChroniclePersonTagCounts,
  collectChronicleTagDisplayNames,
} from "@/lib/chronicle-person-tags";
const aliases = new Map([
  ["lebron-james", "king-james"],
  ["calvin", "cal"],
]);
beforeEach(() =>
  mockAliasSql.mockResolvedValue(
    [...aliases].map(([source_slug, target_slug]) => ({
      source_slug,
      target_slug,
    })),
  ),
);
test("real feed consumer deduplicates alias/canonical mentions by post and keeps family split", async () => {
  expect(
    (await getIdentityTaggedPosts(["king-james", "lebron-james"])).map(
      (p) => p.slug,
    ),
  ).toEqual(["one", "two"]);
  expect((await getIdentityTaggedPosts(["calvin"])).map((p) => p.slug)).toEqual(
    ["family"],
  );
  expect(getTagsWithCounts(getPublishedPosts(), aliases)).toEqual({
    "king-james": 2,
    cal: 1,
    eldrid: 1,
  });
});
test("usage aggregation preserves authored display text without duplicating people or chronicles", () => {
  const posts = [
    {
      slug: "one",
      personTagUsages: [
        { tag: "lebron-james", displayName: "King James" },
        { tag: "king-james", displayName: "the King" },
      ],
    },
  ];
  expect(
    collectChroniclePersonTagCounts(posts, ["king-james"], 10, aliases),
  ).toEqual([{ tag: "king-james", count: 2, chronicleCount: 1 }]);
  expect(
    collectChronicleTagDisplayNames(posts, "king-james", { aliases })
      .map((v) => v.displayName)
      .sort(),
  ).toEqual(["King James", "the King"]);
});
