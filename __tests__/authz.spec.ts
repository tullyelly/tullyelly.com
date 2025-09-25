/**
 * WU-377: Jest unit tests for can()/must()
 * Mocks getEffectivePolicy to isolate decision logic.
 */
jest.mock("@/lib/authz/resolve", () => ({
  getEffectivePolicy: jest.fn(),
}));
jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));
import { getEffectivePolicy } from "@/lib/authz/resolve";
import { can, must } from "@/lib/authz";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";

describe("authz", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    (getEffectivePolicy as jest.Mock).mockReset();
  });

  test("denies when unauthenticated", async () => {
    await expect(
      must(null as any, "tcdb.snapshot.create"),
    ).rejects.toBeInstanceOf(AuthzUnauthenticatedError);
    await expect(can(null as any, "tcdb.snapshot.create")).resolves.toBe(false);
  });

  test("default deny for unknown feature", async () => {
    (getEffectivePolicy as jest.Mock).mockResolvedValue({
      allow: new Set(),
      deny: new Set(),
      enabled: new Set(),
    });
    await expect(can(user, "made.up.feature")).resolves.toBe(false);
  });

  test("allow beats default deny when enabled", async () => {
    (getEffectivePolicy as jest.Mock).mockResolvedValue({
      allow: new Set(["tcdb.snapshot.create"]),
      deny: new Set(),
      enabled: new Set(["tcdb.snapshot.create"]),
    });
    await expect(can(user, "tcdb.snapshot.create")).resolves.toBe(true);
    await expect(must(user, "tcdb.snapshot.create")).resolves.toBeUndefined();
  });

  test("deny overrides allow", async () => {
    (getEffectivePolicy as jest.Mock).mockResolvedValue({
      allow: new Set(["tcdb.snapshot.create"]),
      deny: new Set(["tcdb.snapshot.create"]),
      enabled: new Set(["tcdb.snapshot.create"]),
    });
    await expect(can(user, "tcdb.snapshot.create")).resolves.toBe(false);
    await expect(must(user, "tcdb.snapshot.create")).rejects.toBeInstanceOf(
      AuthzForbiddenError,
    );
  });

  test("disabled feature is treated as deny", async () => {
    (getEffectivePolicy as jest.Mock).mockResolvedValue({
      allow: new Set(["tcdb.snapshot.create"]),
      deny: new Set(),
      enabled: new Set(), // not enabled
    });
    await expect(can(user, "tcdb.snapshot.create")).resolves.toBe(false);
  });
});
