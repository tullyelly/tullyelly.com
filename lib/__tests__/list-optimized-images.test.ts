/** @jest-environment node */
import { listOptimizedImages } from "@/lib/images/list-optimized-images";

jest.mock("server-only", () => ({}));

describe("listOptimizedImages", () => {
  it("returns sorted URLs from nested folders", async () => {
    const urls = await listOptimizedImages("unclejimmy");

    expect(urls).toEqual([...urls].sort());
    expect(urls).toEqual(
      expect.arrayContaining([
        "/images/optimized/unclejimmy/hug-ball/THE-hug-ball.webp",
        "/images/optimized/unclejimmy/hug-ball/hug-ball.webp",
      ]),
    );
  });

  it("returns an empty array for unsafe or missing paths", async () => {
    await expect(listOptimizedImages("..")).resolves.toEqual([]);
    await expect(listOptimizedImages("images/optimized")).resolves.toEqual([]);
    await expect(listOptimizedImages("/images/optimized")).resolves.toEqual([]);
    await expect(listOptimizedImages("does-not-exist")).resolves.toEqual([]);
  });
});
