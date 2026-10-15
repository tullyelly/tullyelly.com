/** @jest-environment node */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import probe from "../../scripts/release/publication-probe.json";

const script = resolve("scripts/check-chronicle-publication.ts");
const loader = require.resolve("tsx");
function check(root: string, slug = "intended", release = false) {
  return spawnSync(
    process.execPath,
    ["--import", loader, script, slug, ...(release ? ["--release"] : [])],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 15000,
    },
  );
}
test("actual Appleton East candidate is publishable with all ten assets and three carousels", () => {
  const result = check(process.cwd(), "appleton-east");
  expect(result.status).toBe(0);
  const report = JSON.parse(result.stdout);
  expect(report.date).toBe("2026-10-13");
  expect(report.assets).toHaveLength(10);
  expect(report.folders).toEqual([
    "appleton-east/george",
    "appleton-east/jeff",
    "appleton-east/1037386",
  ]);
});

test.each([
  "valid",
  "draft",
  "missing",
  "changed-date",
  "changed-text",
  "changed-image",
])("normal release readiness protects published candidate: %s", (mode) => {
  const root = mkdtempSync(join(tmpdir(), "release-chronicle-"));
  try {
    mkdirSync(join(root, "content/chronicles"), { recursive: true });
    mkdirSync(join(root, "lib/images"), { recursive: true });
    for (const asset of probe.assets) {
      mkdirSync(join(root, "public", asset, ".."), { recursive: true });
      writeFileSync(
        join(root, "public", asset),
        readFileSync(`public${asset}`),
      );
    }
    writeFileSync(
      join(root, "lib/images/optimus-images-manifest.json"),
      JSON.stringify({
        urls: probe.assets,
        images: probe.assets.map((src) => ({ src, width: 10, height: 10 })),
      }),
    );
    let source = readFileSync("content/chronicles/appleton-east.mdx", "utf8");
    if (mode === "draft")
      source = source.replace("draft: false", "draft: true");
    if (mode === "changed-date")
      source = source.replace('date: "2026-10-13"', 'date: "2026-10-14"');
    if (mode === "changed-text")
      source = source.replace(probe.text[0], "Different authored sentence.");
    if (mode !== "missing")
      writeFileSync(join(root, "content/chronicles/appleton-east.mdx"), source);
    if (mode === "changed-image")
      writeFileSync(join(root, "public", probe.assets[0]), "changed bytes");
    const result = check(root, "appleton-east", true);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(mode === "valid" ? 0 : 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test.each([
  "missing",
  "draft",
  "missing-image",
  "empty-carousel",
  "stale-manifest",
  "missing-slide",
  "expression",
  "valid",
])("candidate source readiness: %s", (mode) => {
  const root = mkdtempSync(join(tmpdir(), "chronicle-ready-"));
  try {
    for (const dir of [
      "content/chronicles",
      "lib/images",
      "public/images/optimus/intended/slides",
    ])
      mkdirSync(join(root, dir), { recursive: true });
    const urls = [
      "/images/optimus/intended/photo.webp",
      "/images/optimus/intended/slides/one.webp",
    ];
    for (const url of urls)
      if (
        !(mode === "missing-image" && url.endsWith("photo.webp")) &&
        !(mode === "missing-slide" && url.endsWith("one.webp"))
      )
        writeFileSync(join(root, "public", url), "fixture");
    writeFileSync(
      join(root, "lib/images/optimus-images-manifest.json"),
      JSON.stringify({
        urls: mode === "stale-manifest" ? [] : urls,
        images: urls.map((src) => ({ src, width: 10, height: 10 })),
      }),
    );
    if (mode !== "missing")
      writeFileSync(
        join(root, "content/chronicles/intended.mdx"),
        `---\ntitle: intended\nsummary: summary\ndate: "2026-10-13"\ndraft: ${mode === "draft"}\n---\n![photo](photo.webp)\n<FolderImageCarousel folder=${mode === "expression" ? '{"slides"}' : mode === "empty-carousel" ? '"empty"' : '"slides"'} />\n`,
      );
    const result = check(root);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(mode === "valid" ? 0 : 1);
    if (mode === "valid")
      expect(JSON.parse(result.stdout).assets).toEqual(urls);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
