/** @jest-environment node */
import path from "node:path";

import { resolveImageDirs } from "../scripts/image-optimizer-utils.mjs";
import { slugifyChronicleTitle } from "../scripts/slug-utils.mjs";

describe("slugifyChronicleTitle", () => {
  it("matches the chronicle slug format for spaced titles", () => {
    expect(slugifyChronicleTitle("Back At It")).toBe("back-at-it");
    expect(slugifyChronicleTitle("Rock & Roll")).toBe("rock-and-roll");
  });
});

describe("resolveImageDirs", () => {
  it("normalizes a spaced folder name to the chronicle slug format", () => {
    const { normalizedFolderArg, outDirAbs } = resolveImageDirs("back at it");

    expect(normalizedFolderArg).toBe("back-at-it");
    expect(outDirAbs).toBe(path.resolve("public/images/optimus/back-at-it"));
  });

  it("normalizes only the spaced path segments", () => {
    const { normalizedFolderArg, outDirAbs } = resolveImageDirs(
      "unclejimmy/squad/jeff meff",
    );

    expect(normalizedFolderArg).toBe("unclejimmy/squad/jeff-meff");
    expect(outDirAbs).toBe(
      path.resolve("public/images/optimus/unclejimmy/squad/jeff-meff"),
    );
  });

  it("keeps an existing dashed slug unchanged", () => {
    const { normalizedFolderArg, outDirAbs } = resolveImageDirs("back-at-it");

    expect(normalizedFolderArg).toBe("back-at-it");
    expect(outDirAbs).toBe(path.resolve("public/images/optimus/back-at-it"));
  });
});
