import {
  buildTagAliasIndex,
  canonicalTagSlug,
  canonicalTagSlugs,
  equivalentTagSlugs,
} from "@/lib/tag-aliases";
const aliases = buildTagAliasIndex([
  { source_slug: "lebron-james", target_slug: "king-james" },
  { source_slug: "calvin", target_slug: "cal" },
]);
test("explicit one-hop aliases preserve distinct family/athlete identities and unknown/numeric tags", () => {
  expect(
    canonicalTagSlugs(
      [
        "lebron-james",
        "king-james",
        "calvin",
        "cal",
        "eldrid",
        "the-lazer",
        "lazer-face",
      ],
      aliases,
    ),
  ).toEqual(["king-james", "cal", "eldrid", "the-lazer", "lazer-face"]);
  expect(equivalentTagSlugs("calvin", aliases)).toEqual(["cal", "calvin"]);
  expect(canonicalTagSlug("219", aliases)).toBe("219");
  expect(canonicalTagSlug("unknown", aliases)).toBe("unknown");
});
test.each([
  [{ source_slug: "a", target_slug: null }],
  [{ source_slug: "a", target_slug: "a" }],
  [
    { source_slug: "a", target_slug: "b" },
    { source_slug: "a", target_slug: "c" },
  ],
  [
    { source_slug: "a", target_slug: "b" },
    { source_slug: "b", target_slug: "c" },
  ],
  [
    { source_slug: "a", target_slug: "b" },
    { source_slug: "b", target_slug: "a" },
  ],
])("rejects broken alias graphs instead of choosing a target", (...rows) => {
  expect(() => buildTagAliasIndex(rows)).toThrow();
});
