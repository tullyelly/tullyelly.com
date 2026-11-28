/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test.each([
  [
    '<ReleaseSection alterEgo="cardattack"><PersonTag tag="fern" /></ReleaseSection>',
    "2026-11-27",
    true,
  ],
  [
    '<ReleaseSection alterEgo="invalid">Bad inference</ReleaseSection>',
    "2026-11-27",
    false,
  ],
  ["![Missing image](absent.webp)", "2026-11-27", false],
  ["Valid prose", "2026-02-31", false],
  ["<PersonTag />", "2026-11-27", false],
])("focused validation: %s", (body, date, success) => {
  const root = mkdtempSync(join(tmpdir(), "focused-content-"));
  try {
    for (const path of ["content/chronicles", "lib/images", "public"])
      mkdirSync(join(root, path), { recursive: true });
    writeFileSync(
      join(root, "lib/images/optimus-images-manifest.json"),
      JSON.stringify({ urls: [], images: [] }),
    );
    writeFileSync(
      join(root, "content/chronicles/post.mdx"),
      `---\ntitle: Post\nsummary: Test\ndate: "${date}"\ndraft: false\n---\n${body}`,
    );
    const script = `import {validateChangedContent} from ${JSON.stringify(resolve("scripts/release/validate-content.ts"))}; await validateChangedContent({profile:"content",chronicles:["post"],assets:[]}, process.argv[1]);`;
    const child = spawnSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", script, root],
      { encoding: "utf8", env: { ...process.env, SKIP_DB: "true" } },
    );
    expect(child.status === 0).toBe(success);
    if (!success)
      expect(child.stderr).toContain(
        "Chronicle validation failed: content/chronicles/post.mdx",
      );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
