/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import { getCartoonByTagId } from "@/lib/cartoon/getCartoonByTagId";

describe("getCartoonByTagId", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("returns the latest cartoon metadata for a tag", async () => {
    mockSql.mockResolvedValue([
      {
        image_path: "/images/optimus/cartoon/derek.webp",
        description: "Painted for the squad archives.",
      },
    ]);

    await expect(getCartoonByTagId(12)).resolves.toEqual({
      imagePath: "/images/optimus/cartoon/derek.webp",
      description: "Painted for the squad archives.",
    });

    expect(mockSql).toHaveBeenCalledTimes(1);
    const [, values] = mockSql.mock.calls[0] as [TemplateStringsArray, unknown[]];
    expect(values).toEqual([12]);
  });

  it("returns null when the tag has no cartoon row", async () => {
    mockSql.mockResolvedValue([]);

    await expect(getCartoonByTagId(99)).resolves.toBeNull();
  });
});
