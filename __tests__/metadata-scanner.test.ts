/** @jest-environment node */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
it("recognizes typed and re-exported metadata without accepting comments", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "facelift-metadata-"));
  try {
    const pages = {
      typed: "export const metadata: Metadata = {};",
      reexport: 'export { generateMetadata } from "../canonical/page";',
      comment:
        "// export const metadata = {};\nexport default function Page() {}",
    };
    for (const [name, source] of Object.entries(pages)) {
      mkdirSync(path.join(dir, "app", name), { recursive: true });
      writeFileSync(path.join(dir, "app", name, "page.tsx"), source);
    }
    const result = spawnSync(
      process.execPath,
      [path.resolve("scripts/ensure-metadata.js")],
      {
        cwd: dir,
        encoding: "utf8",
        env: { ...process.env, SEO_METADATA_ENFORCE: "strict" },
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("/comment/page.tsx");
    expect(result.stderr).not.toContain("/typed/page.tsx");
    expect(result.stderr).not.toContain("/reexport/page.tsx");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
