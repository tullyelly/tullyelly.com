/**
 * WU-374: Unit tests for admin authz server actions.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://tester:secret@localhost:5432/tullyelly_test";

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));
jest.mock("@/lib/authz", () => ({
  must: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  sql: jest.fn(),
}));
jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

import { revalidateTag } from "next/cache";
import { must } from "@/lib/authz";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  grantRole,
  listMemberships,
  revokeRole,
} from "@/app/admin/authz/actions";

const revalidateTagMock = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>;
const mustMock = must as jest.MockedFunction<typeof must>;
const sqlMock = sql as unknown as jest.MockedFunction<typeof sql>;
const getCurrentUserMock = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

beforeEach(() => {
  jest.clearAllMocks();
  mustMock.mockResolvedValue();
  getCurrentUserMock.mockResolvedValue({
    id: "actor-1",
    email: "actor@example.com",
    authzRevision: 0,
  });
  sqlMock.mockResolvedValue([]);
});

describe("listMemberships", () => {
  test("enforces admin gate and normalizes global app slug", async () => {
    sqlMock.mockResolvedValueOnce([
      {
        user_id: "user-1",
        email: "user@example.com",
        app_slug: "*global*",
        role: "viewer",
        granted_at: "2024-01-01T00:00:00.000Z",
      },
    ] as any);

    const rows = await listMemberships();

    expect(getCurrentUserMock).toHaveBeenCalled();
    expect(mustMock).toHaveBeenCalledWith(
      { id: "actor-1", email: "actor@example.com", authzRevision: 0 },
      "admin.membership.manage",
      { strict: true },
    );
    expect(sqlMock).toHaveBeenCalledTimes(1);
    const strings = sqlMock.mock.calls[0]?.[0];
    expect(Array.from(strings as any)[0]).toContain("SELECT user_id");
    expect(rows).toEqual([
      {
        user_id: "user-1",
        email: "user@example.com",
        app_slug: null,
        role: "viewer",
        granted_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
  });
});

describe("grantRole", () => {
  test("trims input, grants role, and revalidates policy tag", async () => {
    await grantRole({
      userId: " user-2 ",
      role: " admin ",
      appSlug: " admin ",
    });

    expect(mustMock).toHaveBeenCalledWith(
      { id: "actor-1", email: "actor@example.com", authzRevision: 0 },
      "admin.membership.manage",
      { strict: true },
    );
    expect(sqlMock).toHaveBeenCalledTimes(1);
    const call = sqlMock.mock.calls[0];
    expect(call[1]).toBe("actor-1");
    expect(call[2]).toBe("user-2");
    expect(call[3]).toBe("admin");
    expect(call[4]).toBe("admin");
    expect(revalidateTagMock).toHaveBeenCalledWith("auth:user:user-2");
  });

  test("throws when user id missing", async () => {
    await expect(grantRole({ userId: " ", role: "viewer" })).rejects.toThrow(
      /User ID is required/,
    );
    expect(sqlMock).not.toHaveBeenCalled();
  });
});

describe("revokeRole", () => {
  test("prevents self lockout when the last admin would be removed", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-3",
      email: "user@x",
      authzRevision: 0,
    });
    sqlMock.mockResolvedValueOnce([{ n: 1 }] as any);

    await expect(
      revokeRole({ userId: "user-3", role: "ADMIN", appSlug: "Admin" }),
    ).rejects.toThrow(/Refusing to remove the last admin/);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  test("revokes role and revalidates when guard passes", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "actor-2",
      email: "user@x",
      authzRevision: 0,
    });
    sqlMock.mockResolvedValueOnce([{ n: 2 }] as any); // guard
    sqlMock.mockResolvedValueOnce([] as any); // revoke call

    await revokeRole({ userId: "user-4", role: "admin", appSlug: "admin" });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const revokeCall = sqlMock.mock.calls[0];
    expect(revokeCall[1]).toBe("actor-2");
    expect(revokeCall[2]).toBe("user-4");
    expect(revokeCall[3]).toBe("admin");
    expect(revokeCall[4]).toBe("admin");
    expect(revalidateTagMock).toHaveBeenCalledWith("auth:user:user-4");
  });
});
