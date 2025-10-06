jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({})),
}));
jest.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

const getEffectiveFeaturesMock = jest.fn();
const getAuthzRevisionMock = jest.fn();
jest.mock("@/app/_auth/policy", () => ({
  getEffectiveFeatures: (...args: unknown[]) =>
    getEffectiveFeaturesMock(...args),
  getAuthzRevision: (...args: unknown[]) => getAuthzRevisionMock(...args),
}));

import { authOptions } from "@/auth";

describe("NextAuth callbacks", () => {
  beforeEach(() => {
    getEffectiveFeaturesMock.mockReset();
    getAuthzRevisionMock.mockReset();
  });

  it("hydrates token with effective features on sign in", async () => {
    getEffectiveFeaturesMock.mockResolvedValue({
      features: ["menu.mark2.admin"],
      revision: 7,
    });

    const token = await authOptions.callbacks?.jwt?.({
      token: {},
      user: { id: "user-1", email: "x@example.com" },
      trigger: "signIn",
    } as any);

    expect(getEffectiveFeaturesMock).toHaveBeenCalledWith("user-1");
    expect(getAuthzRevisionMock).not.toHaveBeenCalled();
    expect((token as any).features).toEqual(["menu.mark2.admin"]);
    expect((token as any).authzRevision).toBe(7);
  });

  it("short-circuits when revision unchanged", async () => {
    getAuthzRevisionMock.mockResolvedValue(3);

    const token = await authOptions.callbacks?.jwt?.({
      token: {
        features: ["menu.cardattack.tcdb.rankings"],
        authzRevision: 3,
        email: "test@example.com",
        sub: "user-2",
      },
      user: undefined,
      trigger: undefined,
    } as any);

    expect(getAuthzRevisionMock).toHaveBeenCalledWith("user-2");
    expect(getEffectiveFeaturesMock).not.toHaveBeenCalled();
    expect((token as any).features).toEqual(["menu.cardattack.tcdb.rankings"]);
    expect((token as any).authzRevision).toBe(3);
  });

  it("refreshes features when revision bumped", async () => {
    getAuthzRevisionMock.mockResolvedValue(10);
    getEffectiveFeaturesMock.mockResolvedValue({
      features: ["menu.mark2.admin", "menu.cardattack.tcdb.rankings"],
      revision: 10,
    });

    const token = await authOptions.callbacks?.jwt?.({
      token: {
        features: ["menu.mark2.admin"],
        authzRevision: 5,
        email: "owner@tullyelly.com",
        sub: "user-9",
      },
      user: undefined,
      trigger: undefined,
    } as any);

    expect(getAuthzRevisionMock).toHaveBeenCalledWith("user-9");
    expect(getEffectiveFeaturesMock).toHaveBeenCalledWith("user-9");
    expect((token as any).features).toEqual([
      "menu.mark2.admin",
      "menu.cardattack.tcdb.rankings",
    ]);
    expect((token as any).authzRevision).toBe(10);
  });

  it("copies features to session", async () => {
    const session = await authOptions.callbacks?.session?.({
      session: { user: { email: null, name: null } },
      token: {
        email: "test@example.com",
        name: "Tester",
        features: ["menu.mark2.admin"],
        authzRevision: 9,
      },
    } as any);

    expect(session?.user).toBeDefined();
    expect((session?.user as any).features).toEqual(["menu.mark2.admin"]);
    expect((session?.user as any).authzRevision).toBe(9);
  });
});
