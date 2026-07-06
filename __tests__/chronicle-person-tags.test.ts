jest.mock("contentlayer/generated", () => ({
  allPosts: [],
}));

import { collectChronicleTagDisplayNames } from "@/lib/chronicle-person-tags";

describe("collectChronicleTagDisplayNames", () => {
  it("collects exact display-name variants for a normalized tag", () => {
    expect(
      collectChronicleTagDisplayNames(
        [
          {
            slug: "one",
            personTagUsages: [
              { tag: "Freak", displayName: "giannis" },
              { tag: "freak", displayName: "the greek freak" },
            ],
          },
          {
            slug: "two",
            personTagUsages: [
              { tag: "freak", displayName: "giannis" },
              { tag: "bucks-n-six", displayName: "bucks" },
            ],
          },
          {
            slug: "draft",
            draft: true,
            personTagUsages: [{ tag: "freak", displayName: "draft name" }],
          },
        ],
        "freak",
      ),
    ).toEqual([
      { displayName: "giannis", count: 2, chronicleCount: 2 },
      { displayName: "the greek freak", count: 1, chronicleCount: 1 },
    ]);
  });

  it("ignores malformed generated usage entries", () => {
    expect(
      collectChronicleTagDisplayNames(
        [
          {
            slug: "one",
            personTagUsages: [
              { tag: "freak", displayName: "giannis" },
              { tag: "freak" },
              null,
            ],
          },
        ],
        "freak",
      ),
    ).toEqual([{ displayName: "giannis", count: 1, chronicleCount: 1 }]);
  });
});
