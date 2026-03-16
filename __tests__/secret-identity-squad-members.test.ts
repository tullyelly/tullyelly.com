/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getSecretIdentitySquadMember,
  listDynamicSquadMemberParams,
} from "@/lib/unclejimmy/secretIdentitySquadMembers";

describe("secretIdentitySquadMembers", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("builds params from secret identity slugs and de-dupes rows by slug", async () => {
    mockSql.mockResolvedValue([
      { user_id: "1", tag_slug: "eeeeeeeemma" },
      { user_id: "2", tag_slug: "eeeeeeeemma" },
      { user_id: "3", tag_slug: "lulu" },
    ]);

    await expect(listDynamicSquadMemberParams()).resolves.toEqual([
      { member: "eeeeeeeemma" },
      { member: "lulu" },
    ]);

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual(["jeff-meff", "bonnibel", "volleyball"]);
  });

  it("looks up the display name from v_user_profile and falls back to the slug", async () => {
    mockSql.mockResolvedValueOnce([
      { user_id: "1", tag_id: 44, tag_slug: "eeeeeeeemma", name: "Emma" },
    ]);

    await expect(getSecretIdentitySquadMember("EEEEEEEEEMMA")).resolves.toEqual(
      {
        userId: "1",
        tagId: 44,
        tagSlug: "eeeeeeeemma",
        displayName: "Emma",
      },
    );

    mockSql.mockResolvedValueOnce([
      { user_id: "2", tag_id: 77, tag_slug: "lulu", name: "" },
    ]);

    await expect(getSecretIdentitySquadMember("lulu")).resolves.toEqual({
      userId: "2",
      tagId: 77,
      tagSlug: "lulu",
      displayName: "lulu",
    });
  });

  it("skips reserved static member slugs", async () => {
    await expect(getSecretIdentitySquadMember("bonnibel")).resolves.toBeNull();
    expect(mockSql).not.toHaveBeenCalled();
  });
});
