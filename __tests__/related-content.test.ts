import {
  rankRelatedContent,
  type RelatedContentSource,
} from "@/lib/related-content";

function item(
  id: string,
  overrides: Partial<RelatedContentSource> = {},
): RelatedContentSource {
  return {
    id,
    title: id,
    summary: `${id} summary`,
    date: "2026-01-01",
    href: `/shaolin/${id}`,
    tags: [],
    persona: null,
    ...overrides,
  };
}

describe("rankRelatedContent", () => {
  it("ranks shared tags above persona-only matches and retains reasons", () => {
    const current = item("current", {
      tags: ["Cards", "Bucks"],
      persona: "cardattack",
    });
    const results = rankRelatedContent(current, [
      item("persona", { persona: "cardattack", date: "2026-03-01" }),
      item("tag", { tags: ["cards"] }),
      item("multiple", { tags: ["bucks", "cards"], persona: "cardattack" }),
    ]);

    expect(results.map((result) => result.id)).toEqual([
      "multiple",
      "tag",
      "persona",
    ]);
    expect(results[0].reasons).toEqual([
      { type: "tag", value: "bucks" },
      { type: "tag", value: "cards" },
      { type: "persona", value: "cardattack" },
    ]);
  });

  it("excludes the current item and drafts, then deduplicates candidates", () => {
    const current = item("current", { tags: ["shared"] });
    const results = rankRelatedContent(current, [
      current,
      item("current-copy", {
        href: "/shaolin/current/",
        tags: ["shared"],
      }),
      item("draft", { tags: ["shared"], draft: true }),
      item("duplicate", { tags: ["shared"] }),
      item("duplicate-copy", {
        href: "/shaolin/duplicate/",
        tags: ["shared"],
      }),
    ]);

    expect(results.map((result) => result.id)).toEqual(["duplicate"]);
  });

  it("omits candidates below the relevance threshold", () => {
    expect(
      rankRelatedContent(item("current", { tags: ["one"] }), [
        item("unrelated", { tags: ["two"] }),
      ]),
    ).toEqual([]);
  });

  it("uses date, title, and id for deterministic score ties", () => {
    const current = item("current", { tags: ["shared"] });
    const results = rankRelatedContent(current, [
      item("z-id", { title: "Alpha", tags: ["shared"] }),
      item("a-id", { title: "Alpha", tags: ["shared"] }),
      item("newer", {
        title: "Zulu",
        date: "2026-02-01",
        tags: ["shared"],
      }),
    ]);

    expect(results.map((result) => result.id)).toEqual([
      "newer",
      "a-id",
      "z-id",
    ]);
  });
});
