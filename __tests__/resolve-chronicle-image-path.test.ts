import {
  resolveChronicleCarouselFolder,
  resolveChronicleImagePath,
} from "@/lib/images/resolve-chronicle-image-path";

describe("resolveChronicleImagePath", () => {
  test.each([
    ["fern.webp", "/images/optimus/vomitspit/fern.webp"],
    ["./fern.webp", "/images/optimus/vomitspit/fern.webp"],
    ["plants/fern.webp", "/images/optimus/vomitspit/plants/fern.webp"],
    ["/images/optimus/shared/fern.webp", "/images/optimus/shared/fern.webp"],
    ["/uploads/fern.webp", "/uploads/fern.webp"],
    ["https://example.com/fern.webp", "https://example.com/fern.webp"],
  ])("resolves %s", (src, expected) => {
    expect(resolveChronicleImagePath("vomitspit", src)).toBe(expected);
  });

  it("rejects relative path traversal", () => {
    expect(() =>
      resolveChronicleImagePath("vomitspit", "../shared/fern.webp"),
    ).toThrow("cannot traverse");
    expect(() =>
      resolveChronicleImagePath("vomitspit", "%2e%2e/shared/fern.webp"),
    ).toThrow("cannot traverse");
  });
});

describe("resolveChronicleCarouselFolder", () => {
  it("resolves relative, root, and existing slug-qualified folders", () => {
    expect(resolveChronicleCarouselFolder("rye", "faith")).toBe("rye/faith");
    expect(resolveChronicleCarouselFolder("rye")).toBe("rye");
    expect(resolveChronicleCarouselFolder("rye", "rye/faith")).toBe(
      "rye/faith",
    );
  });

  it("rejects relative path traversal", () => {
    expect(() => resolveChronicleCarouselFolder("rye", "../faith")).toThrow(
      "cannot traverse",
    );
  });
});
