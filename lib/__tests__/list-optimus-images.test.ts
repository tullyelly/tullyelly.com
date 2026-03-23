/** @jest-environment node */
import { listOptimusImages } from "@/lib/images/list-optimus-images";

jest.mock("server-only", () => ({}));

describe("listOptimusImages", () => {
  it("returns sorted URLs from nested folders", async () => {
    const urls = await listOptimusImages("unclejimmy");

    expect(urls).toEqual([...urls].sort());
    expect(urls).toEqual(
      expect.arrayContaining([
        "/images/optimus/unclejimmy/hug-ball/THE-hug-ball.webp",
        "/images/optimus/unclejimmy/hug-ball/hug-ball.webp",
      ]),
    );
  });

  it("returns an empty array for unsafe or missing paths", async () => {
    await expect(listOptimusImages("..")).resolves.toEqual([]);
    await expect(listOptimusImages("images/optimus")).resolves.toEqual([]);
    await expect(listOptimusImages("/images/optimus")).resolves.toEqual([]);
    await expect(listOptimusImages("does-not-exist")).resolves.toEqual([]);
  });
});
