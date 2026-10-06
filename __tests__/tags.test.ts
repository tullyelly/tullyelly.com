import {
  getDefaultTagHref,
  getHashtagDisplayName,
  getKnownTagDisplayName,
  getKnownTagHref,
  getTagDisplayName,
  normalizeTagSlug,
} from "@/lib/tags";

describe("tag formatting", () => {
  it("normalizes tag slugs to lowercase with dashed spaces", () => {
    expect(normalizeTagSlug(" DOOM ")).toBe("doom");
    expect(normalizeTagSlug("NikkiGirl")).toBe("nikkigirl");
    expect(normalizeTagSlug("Gang Starr")).toBe("gang-starr");
  });

  it("renders DOOM in all caps", () => {
    expect(getTagDisplayName("doom")).toBe("DOOM");
    expect(getTagDisplayName("DOOM")).toBe("DOOM");
    expect(getHashtagDisplayName("doom")).toBe("#DOOM");
  });

  it("keeps other tags lowercase", () => {
    expect(getTagDisplayName("eeeeeeeemma")).toBe("eeeeeeeemma");
    expect(getHashtagDisplayName("NikkiGirl")).toBe("#nikkigirl");
  });

  it("builds default Shaolin tag archive routes", () => {
    expect(getDefaultTagHref("Gang Starr")).toBe("/shaolin/tags/gang-starr");
  });

  it.each([
    "unclejimmy",
    "mark2",
    "cardattack",
    "theabbott",
    "tullyelly",
    "shaolin",
    "lulu",
    "bonnibel",
    "jeff-meff",
    "nikkigirl",
    "eeeeeeeemma",
  ])("has no hard-coded routing tier for %s", (tag) => {
    expect(getKnownTagHref(tag)).toBe(getDefaultTagHref(tag));
  });

  it("falls back to known display overrides before the normalized slug", () => {
    expect(getKnownTagDisplayName("DOOM")).toBe("DOOM");
    expect(getKnownTagDisplayName("Gang Starr")).toBe("gang-starr");
  });
});
