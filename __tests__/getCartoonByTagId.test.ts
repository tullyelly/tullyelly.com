/** @jest-environment node */

const mockSql = jest.fn();

jest.mock("@/lib/db", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    mockSql(strings, values),
}));

import {
  getCartoonByTagId,
  resolveCartoonImagePath,
} from "@/lib/cartoon/getCartoonByTagId";

describe("resolveCartoonImagePath", () => {
  it.each([
    ["/images/optimus/cartoon/lulu.webp"],
    ["/images/optimus/cartoon/lulu"],
    ["images/optimus/cartoon/lulu"],
    ["/images/optimus/cartoon/LULU.WEBP"],
    ["/images/optimus/cartoon/LULU"],
    ["/images/optimized/cartoon/lulu.webp"],
    ["/images/optimized/cartoon/lulu"],
    ["images/optimized/cartoon/LULU.WEBP"],
  ])("resolves %s to the deployed cartoon asset", (imagePath) => {
    expect(resolveCartoonImagePath(imagePath)).toBe(
      "/images/optimus/cartoon/lulu.webp",
    );
  });

  it("returns null for missing cartoon assets", () => {
    expect(
      resolveCartoonImagePath("/images/optimus/cartoon/missing"),
    ).toBeNull();
  });
});

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
    const [, values] = mockSql.mock.calls[0] as [
      TemplateStringsArray,
      unknown[],
    ];
    expect(values).toEqual([12]);
  });

  it("returns null when the tag has no cartoon row", async () => {
    mockSql.mockResolvedValue([]);

    await expect(getCartoonByTagId(99)).resolves.toBeNull();
  });

  it("normalizes legacy extensionless cartoon paths", async () => {
    mockSql.mockResolvedValue([
      {
        image_path: "/images/optimus/cartoon/lulu",
        description: "Painted for the squad archives.",
      },
    ]);

    await expect(getCartoonByTagId(44)).resolves.toEqual({
      imagePath: "/images/optimus/cartoon/lulu.webp",
      description: "Painted for the squad archives.",
    });
  });

  it("normalizes legacy optimized cartoon paths", async () => {
    mockSql.mockResolvedValue([
      {
        image_path: "/images/optimized/cartoon/nikkigirl.webp",
        description: "Painted for the squad archives.",
      },
    ]);

    await expect(getCartoonByTagId(45)).resolves.toEqual({
      imagePath: "/images/optimus/cartoon/nikkigirl.webp",
      description: "Painted for the squad archives.",
    });
  });

  it("returns null when the cartoon row points at a missing asset", async () => {
    mockSql.mockResolvedValue([
      {
        image_path: "/images/optimus/cartoon/missing",
        description: "Missing from the deployed bundle.",
      },
    ]);

    await expect(getCartoonByTagId(55)).resolves.toBeNull();
  });
});
