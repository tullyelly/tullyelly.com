import { getAuthzRevision, getEffectiveFeatures } from "@/app/_auth/policy";

jest.mock("@/lib/db", () => ({
  sql: jest.fn(),
}));

import { sql } from "@/lib/db";

describe("policy helpers", () => {
  beforeEach(() => {
    (sql as jest.Mock).mockReset();
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
