import { getAuthzRevision, getEffectiveFeatures } from "@/app/_auth/policy";

jest.mock("@/lib/db", () => ({
  sql: jest.fn(),
}));

import { sql } from "@/lib/db";

describe("policy helpers", () => {
  const originalSkipDb = process.env.SKIP_DB;

  afterEach(() => {
    if (originalSkipDb === undefined) delete process.env.SKIP_DB;
    else process.env.SKIP_DB = originalSkipDb;
  });
  beforeEach(() => {
    // These tests use mocked DB/policy dependencies, never a real connection.
    delete process.env.SKIP_DB;
    (sql as jest.Mock).mockReset();
  });

  it("SKIP_DB preserves empty policy fallbacks without invoking SQL", async () => {
    process.env.SKIP_DB = "true";
    expect(await getAuthzRevision("user-123")).toBe(0);
    expect(await getEffectiveFeatures("user-123")).toEqual({
      features: [],
      revision: 0,
    });
    expect(sql).not.toHaveBeenCalled();
  });

  it("returns revision for user", async () => {
    (sql as jest.Mock).mockResolvedValueOnce([{ revision: 9 }]);

    const revision = await getAuthzRevision("user-123");

    expect(sql).toHaveBeenCalledTimes(1);
    expect(revision).toBe(9);
  });

  it("returns sorted unique features with revision", async () => {
    (sql as jest.Mock).mockResolvedValueOnce([
      { features: ["menu.beta", "menu.alpha", "menu.alpha"], revision: 5 },
    ]);

    const snapshot = await getEffectiveFeatures("user-123");

    expect(sql).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual({
      features: ["menu.alpha", "menu.beta"],
      revision: 5,
    });
  });

  it("handles empty result sets", async () => {
    (sql as jest.Mock).mockResolvedValueOnce([
      { features: null, revision: null },
    ]);

    const snapshot = await getEffectiveFeatures("user-123");

    expect(snapshot).toEqual({ features: [], revision: 0 });
  });

  it("short-circuits when user id is missing", async () => {
    const snapshot = await getEffectiveFeatures(undefined);
    expect(snapshot).toEqual({ features: [], revision: 0 });
    expect(sql).not.toHaveBeenCalled();

    const revision = await getAuthzRevision(null);
    expect(revision).toBe(0);
  });
});
