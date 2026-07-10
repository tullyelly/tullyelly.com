import {
  getPersonaReleaseFeed,
  getPersonaReleaseLogHref,
  isPersonaReleaseFeed,
} from "@/lib/persona-release-feeds";

describe("persona release feed configuration", () => {
  it("supports only the five release-feed personas", () => {
    expect(["mark2", "cardattack", "theabbott", "unclejimmy", "tullyelly"].every(isPersonaReleaseFeed)).toBe(true);
    expect(getPersonaReleaseFeed("george")).toBeNull();
    expect(getPersonaReleaseFeed("shaolin")).toBeNull();
  });

  it("uses clean page-one and query-string later-page URLs", () => {
    expect(getPersonaReleaseLogHref("mark2")).toBe("/mark2/releases");
    expect(getPersonaReleaseLogHref("mark2", 1)).toBe("/mark2/releases");
    expect(getPersonaReleaseLogHref("mark2", 2)).toBe("/mark2/releases?page=2");
    expect(getPersonaReleaseLogHref("mark2", 1, "oldest")).toBe("/mark2/releases?order=oldest");
    expect(getPersonaReleaseLogHref("mark2", 2, "oldest")).toBe("/mark2/releases?page=2&order=oldest");
  });
});
