import {
  getReleaseSectionAnchorId,
  getReleaseSectionHref,
} from "@/lib/release-section-anchor";

describe("release section anchors", () => {
  it("builds source-order anchor ids and chronicle deep links", () => {
    expect(getReleaseSectionAnchorId(2)).toBe("release-section-2");
    expect(getReleaseSectionHref("/shaolin/avenue-q", 2)).toBe(
      "/shaolin/avenue-q#release-section-2",
    );
  });
});
