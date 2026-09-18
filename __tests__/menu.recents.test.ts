import {
  readRecent,
  recordRecentVisit,
  saveRecent,
  titleForRecentDocument,
  upsertRecent,
  RECENT_LIMIT,
  RECENT_STORAGE_KEY,
} from "@/lib/menu.recents";

describe("menu recents", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("moves an existing entry to the front", () => {
    const alpha = { href: "/alpha", title: "Alpha" };
    const beta = { href: "/beta", title: "Beta" };
    const gamma = { href: "/gamma", title: "Gamma" };
    const next = upsertRecent([alpha, beta, gamma], beta);
    expect(next).toEqual([beta, alpha, gamma]);
  });

  it("trims history to the configured limit", () => {
    const seed = Array.from({ length: RECENT_LIMIT }, (_, index) => ({
      href: `/item-${index}`,
      title: `Item ${index}`,
    }));
    const next = upsertRecent(seed, { href: "/new", title: "New" });
    expect(next).toHaveLength(RECENT_LIMIT);
    expect(next[0]?.href).toBe("/new");
    expect(next.some((item) => item.href === `/item-${RECENT_LIMIT - 1}`)).toBe(
      false,
    );
  });

  it("reads and normalizes legacy persisted entries", () => {
    const payload = JSON.stringify(["/alpha", "", " /beta ", "/alpha"]);
    window.localStorage.setItem(RECENT_STORAGE_KEY, payload);
    expect(readRecent()).toEqual([
      { href: "/alpha", title: "Alpha" },
      { href: "/beta", title: "Beta" },
    ]);
  });

  it("returns an empty history for malformed localStorage", () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, "{broken");
    expect(readRecent()).toEqual([]);
  });

  it("records a normalized visited route and deduplicates it", () => {
    recordRecentVisit({ href: "/shaolin/example?ref=home", title: "Example" });
    recordRecentVisit({ href: "/shaolin/example", title: "Updated Example" });

    expect(readRecent()).toEqual([
      { href: "/shaolin/example", title: "Updated Example" },
    ]);
  });

  it("rejects error-page titles", () => {
    expect(titleForRecentDocument("Page Not Found; tullyelly")).toBeNull();
    expect(titleForRecentDocument("Access denied; tullyelly")).toBeNull();
  });

  it("ignores storage errors when saving", () => {
    const spy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("nope");
      });
    expect(() =>
      saveRecent([{ href: "/alpha", title: "Alpha" }]),
    ).not.toThrow();
    spy.mockRestore();
  });
});
