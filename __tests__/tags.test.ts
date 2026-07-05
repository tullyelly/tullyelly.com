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
    expect(getDefaultTagHref("Gang Starr")).toBe(
      "/shaolin/tags/gang-starr",
    );
  });

  it("routes known alter ego tags to persona landing pages", () => {
    expect(getKnownTagHref("unclejimmy")).toBe("/unclejimmy");
    expect(getKnownTagHref("mark2")).toBe("/mark2");
    expect(getKnownTagHref("cardattack")).toBe("/cardattack");
    expect(getKnownTagHref("theabbott")).toBe("/theabbott");
    expect(getKnownTagHref("tullyelly")).toBe("/tullyelly");
    expect(getKnownTagHref("shaolin")).toBe("/shaolin");
  });

  it("routes known squad tags to squad pages", () => {
    expect(getKnownTagHref("lulu")).toBe("/unclejimmy/squad/lulu");
    expect(getKnownTagHref("bonnibel")).toBe("/unclejimmy/squad/bonnibel");
    expect(getKnownTagHref("jeff-meff")).toBe(
      "/unclejimmy/squad/jeff-meff",
    );
    expect(getKnownTagHref("nikkigirl")).toBe(
      "/unclejimmy/squad/nikkigirl",
    );
    expect(getKnownTagHref("eeeeeeeemma")).toBe(
      "/unclejimmy/squad/eeeeeeeemma",
    );
  });

  it("falls back to known display overrides before the normalized slug", () => {
    expect(getKnownTagDisplayName("DOOM")).toBe("DOOM");
    expect(getKnownTagDisplayName("Gang Starr")).toBe("gang-starr");
  });
});
