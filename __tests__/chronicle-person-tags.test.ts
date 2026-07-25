jest.mock("contentlayer/generated", () => ({
  allPosts: [],
}));

import {
  collectChroniclePersonTagCounts,
  collectChronicleTagDisplayNames,
} from "@/lib/chronicle-person-tags";

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

  it("collects ClanSnapshot usages for clan tag display names", () => {
    expect(
      collectChronicleTagDisplayNames(
        [
          {
            slug: "one",
            clanTagUsages: [{ tag: "noles", displayName: "noles" }],
          },
          {
            slug: "two",
            clanTagUsages: [{ tag: "NOLES", displayName: "NOLES" }],
            personTagUsages: [{ tag: "noles", displayName: "seminoles" }],
          },
        ],
        "noles",
      ),
    ).toEqual([
      { displayName: "noles", count: 1, chronicleCount: 1 },
      { displayName: "NOLES", count: 1, chronicleCount: 1 },
      { displayName: "seminoles", count: 1, chronicleCount: 1 },
    ]);
  });
});

describe("collectChroniclePersonTagCounts", () => {
  it("counts published PersonTag mentions for allowed homie slugs", () => {
    expect(
      collectChroniclePersonTagCounts(
        [
          {
            slug: "one",
            personTagUsages: [
              { tag: "Freak", displayName: "Giannis" },
              { tag: "freak", displayName: "the Greek Freak" },
              { tag: "pr imetime", displayName: "ignored malformed slug" },
            ],
          },
          {
            slug: "two",
            personTagUsages: [
              { tag: "primetime", displayName: "Deion" },
              { tag: "freak", displayName: "Giannis" },
            ],
          },
          {
            slug: "draft",
            draft: true,
            personTagUsages: [{ tag: "freak", displayName: "draft" }],
          },
        ],
        ["freak", "primetime"],
      ),
    ).toEqual([
      { tag: "freak", count: 3, chronicleCount: 2 },
      { tag: "primetime", count: 1, chronicleCount: 1 },
    ]);
  });

  it("uses tag name ordering for equal counts and respects the limit", () => {
    expect(
      collectChroniclePersonTagCounts(
        [
          {
            slug: "one",
            personTagUsages: [
              { tag: "vin", displayName: "Vin" },
              { tag: "freak", displayName: "Giannis" },
            ],
          },
        ],
        ["vin", "freak"],
        1,
      ),
    ).toEqual([{ tag: "freak", count: 1, chronicleCount: 1 }]);
  });
});
