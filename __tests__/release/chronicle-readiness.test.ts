/** @jest-environment node */
import { execFileSync, spawnSync } from "node:child_process";
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

const executableDirectory = mkdtempSync(join(tmpdir(), "chronicle-ready-cli-"));
const script = join(executableDirectory, "check-chronicle-publication.cjs");
const planScript = join(executableDirectory, "publication-plan.cjs");
beforeAll(() => {
  // Exercise the actual CLI for every fixture without repeatedly cold-starting
  // tsx and the MDX dependency graph alongside parallel coverage workers.
  const { buildSync } = require(
    require.resolve("esbuild", { paths: [require.resolve("tsx")] }),
  ) as {
    buildSync(options: {
      entryPoints: string[];
      outfile: string;
      bundle: boolean;
      platform: "node";
      format: "cjs";
      target: string;
      logLevel: "silent";
    }): void;
  };
  buildSync({
    entryPoints: [resolve("scripts/check-chronicle-publication.ts")],
    outfile: script,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    logLevel: "silent",
  });
  const entry = join(executableDirectory, "publication-plan.ts");
  writeFileSync(
    entry,
    `import { planArchiveListing, planPublicationChecks } from ${JSON.stringify(resolve("scripts/release/code-publication-plan.ts"))};
const [previous, commit] = process.argv.slice(2);
try {
  console.log(JSON.stringify(previous === "-" ? planArchiveListing(commit) : planPublicationChecks(previous, commit)));
} catch (error) {
  console.error(error instanceof Error ? error.message : "failed");
  process.exitCode = 1;
}
`,
  );
  buildSync({
    entryPoints: [entry],
    outfile: planScript,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    logLevel: "silent",
  });
});

function archiveFixture() {
  const root = mkdtempSync(join(tmpdir(), "publication-plan-"));
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (key.startsWith("GIT_")) delete env[key];
  function git(...args: string[]) {
    return execFileSync("git", args, {
      cwd: root,
      env,
      encoding: "utf8",
    }).trim();
  }
  git("init", "--quiet");
  for (const directory of ["content/chronicles", "lib/images", "public"])
    mkdirSync(join(root, directory), { recursive: true });
  writeFileSync(join(root, "public/.keep"), "");
  writeFileSync(
    join(root, "lib/images/optimus-images-manifest.json"),
    JSON.stringify({ urls: [], images: [] }),
  );
  function post(slug: string, date: string, extra = "draft: false") {
    writeFileSync(
      join(root, `content/chronicles/${slug}.mdx`),
      `---\ntitle: ${slug}\nsummary: fixture\ndate: ${date}\n${extra}\n---\nThe rendered Chronicle still contains this authored publication sample.\n`,
    );
  }
  function commit() {
    git("add", ".");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "commit",
      "--quiet",
      "--no-verify",
      "-m",
      "Reviewed fixture",
    );
    return git("rev-parse", "HEAD");
  }
  function plan(previous: string, target: string) {
    return spawnSync(process.execPath, [planScript, previous, target], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 15000,
    });
  }
  return {
    root,
    post,
    commit,
    plan,
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("archive expectation uses the full target publication order for old edits, backfills and code-only releases", () => {
  const f = archiveFixture();
  try {
    f.post("old-post", '"2026-01-01"');
    f.post("b-date-only", "2026-10-23", "published: false");
    f.post("a-latest", '"2026-10-23T00:00:00-05:00"', "");
    for (let index = 0; index < 10; index++)
      f.post(`c-same-date-${index}`, '"2026-10-23"');
    f.post("z-earlier-offset", '"2026-10-23T04:30:00Z"');
    f.post("future-draft", '"2027-01-01"', "draft: true");
    let previous = f.commit();
    const archive = { path: "/shaolin/b-date-only", title: "b-date-only" };
    for (const change of ["old-post", "backfill", "code-only"]) {
      if (change === "code-only")
        writeFileSync(
          join(f.root, "source.ts"),
          "export const reviewed = true;\n",
        );
      else f.post(change, '"2026-01-02"');
      const target = f.commit();
      // A dirty future Chronicle must never participate in the approved plan.
      f.post("dirty-future", '"2028-01-01"');
      const result = f.plan(previous, target);
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        archive,
        chronicles:
          change === "code-only" ? [] : [{ path: `/shaolin/${change}` }],
        assets: [],
      });
      rmSync(join(f.root, "content/chronicles/dirty-future.mdx"));
      previous = target;
    }
    const retained = previous;
    f.post("new-release", '"2026-10-24"');
    const newer = f.commit();
    expect(JSON.parse(f.plan("-", newer).stdout)).toEqual({
      path: "/shaolin/new-release",
      title: "new-release",
    });
    expect(JSON.parse(f.plan("-", retained).stdout)).toEqual(archive);
  } finally {
    f.dispose();
  }
});

test("archive planning fails closed without a published collection or valid target metadata", () => {
  const f = archiveFixture();
  try {
    f.post("only-draft", '"2027-01-01"', "draft: true");
    const empty = f.commit();
    expect(f.plan("-", empty)).toMatchObject({
      status: 1,
      stderr: "code.publication-plan\n",
    });
    f.post("broken-date", '"invalid-date"');
    expect(f.plan("-", f.commit())).toMatchObject({
      status: 1,
      stderr: "code.publication-plan\n",
    });
    expect(f.plan("-", "main")).toMatchObject({
      status: 1,
      stderr: "code.application-sha\n",
    });
  } finally {
    f.dispose();
  }
});
afterAll(() => rmSync(executableDirectory, { recursive: true, force: true }));
function check(root: string, slug = "intended", release = false) {
  return spawnSync(
    process.execPath,
    [script, slug, ...(release ? ["--release"] : [])],
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
