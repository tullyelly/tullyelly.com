import {
  readRecent,
  saveRecent,
  upsertRecent,
  RECENT_LIMIT,
  RECENT_STORAGE_KEY,
} from "@/lib/menu.recents";

describe("menu recents", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("moves an existing entry to the front", () => {
    const next = upsertRecent(["/alpha", "/beta", "/gamma"], "/beta");
    expect(next).toEqual(["/beta", "/alpha", "/gamma"]);
  });

  it("trims history to the configured limit", () => {
    const seed = Array.from(
      { length: RECENT_LIMIT },
      (_, index) => `/item-${index}`,
    );
    const next = upsertRecent(seed, "/new");
    expect(next).toHaveLength(RECENT_LIMIT);
    expect(next[0]).toBe("/new");
    expect(next.includes(`/item-${RECENT_LIMIT - 1}`)).toBe(false);
  });

  it("reads and normalizes persisted entries", () => {
    const payload = JSON.stringify(["/alpha", "", " /beta ", "/alpha"]);
    window.localStorage.setItem(RECENT_STORAGE_KEY, payload);
    expect(readRecent()).toEqual(["/alpha", "/beta"]);
  });

  it("ignores storage errors when saving", () => {
    const spy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("nope");
      });
    expect(() => saveRecent(["/alpha"])).not.toThrow();
    spy.mockRestore();
  });
});
