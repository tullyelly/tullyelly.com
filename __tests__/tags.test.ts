import {
  getHashtagDisplayName,
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
});
