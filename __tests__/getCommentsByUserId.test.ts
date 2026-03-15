/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import { getCommentsByUserId } from "@/lib/comments/getCommentsByUserId";

describe("getCommentsByUserId", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("returns comments ordered by created_at desc with serialized timestamps", async () => {
    mockSql.mockResolvedValue([
      {
        id: "42",
        post_slug: "secret-identity",
        user_id: "user-1",
        user_name: "Emma",
        body: "comment body",
        created_at: new Date("2026-03-14T18:22:00.000Z"),
      },
    ]);

    await expect(getCommentsByUserId("user-1")).resolves.toEqual([
      {
        id: "42",
        postSlug: "secret-identity",
        userId: "user-1",
        userName: "Emma",
        body: "comment body",
        createdAt: "2026-03-14T18:22:00.000Z",
      },
    ]);

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["user-1"]);
  });

  it("returns an empty array when the user has no comments", async () => {
    mockSql.mockResolvedValue([]);

    await expect(getCommentsByUserId("user-2")).resolves.toEqual([]);
  });
});
