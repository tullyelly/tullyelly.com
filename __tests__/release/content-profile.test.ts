/** @jest-environment node */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "content-policy-test-"));
const executable = join(directory, "classify.cjs");
beforeAll(() => {
  const entry = join(directory, "entry.ts");
  writeFileSync(
    entry,
    `import { classifyContent } from ${JSON.stringify(resolve("scripts/release/content-profile.ts"))}; console.log(JSON.stringify(classifyContent(process.argv[2], process.argv[3])));`,
  );
  require(
    require.resolve("esbuild", { paths: [require.resolve("tsx")] }),
  ).buildSync({
    entryPoints: [entry],
    outfile: executable,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent",
  });
});
afterAll(() => rmSync(directory, { recursive: true, force: true }));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "content-policy-repo-"));
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (key.startsWith("GIT_")) delete env[key];
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const put = (path: string, body: string) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), body);
  };
  const commit = () => {
    git("add", ".");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "commit",
      "--no-verify",
      "-qm",
      "fixture",
    );
    return git("rev-parse", "HEAD");
  };
  git("init", "-q");
  put(
    "lib/images/optimus-images-manifest.json",
    JSON.stringify({ urls: [], images: [] }),
  );
  const source = (body: string, draft = false) =>
    `---\ntitle: Test\nsummary: Fixture\ndate: "2026-11-27"\ndraft: ${draft}\n---\n${body}\n`;
  put("content/chronicles/first.mdx", source("Original authored prose."));
  const baseline = commit();
  return {
    root,
    put,
    commit,
    baseline,
    source,
    classify: (base = baseline) =>
      JSON.parse(
        execFileSync(
          process.execPath,
          [executable, base, git("rev-parse", "HEAD")],
          { cwd: root, env, encoding: "utf8" },
        ),
      ),
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}
test("real component-rich Chronicle and daily metadata use content profile", () => {
  const f = fixture();
  try {
    f.put(
      "content/chronicles/first.mdx",
      f.source(
        '<ReleaseSection alterEgo="cardattack"><PersonTag tag="fern" /><TcdbSnapshot tag="magic" /><ClanSnapshot tag="noles" /><CategorySnapshot category="football" /></ReleaseSection>',
      ),
    );
    f.put(
      ".jira/active-epic.json",
      JSON.stringify({
        epic: "WU-1117",
        branch: "epic/WU-1117-chronicle-publishing",
        day: "2026-11-27",
        timezone: "America/Chicago",
      }),
    );
    f.commit();
    expect(f.classify()).toMatchObject({
      profile: "content",
      chronicles: ["first"],
      policy: "chronicles-v1",
    });
  } finally {
    f.dispose();
  }
});
test.each([
  'import Evil from "./evil";\n\n<Evil />',
  "{process.exit()}",
  "<PersonTag tag={getTag()} />",
  "<Unknown />",
  '<img src="x" onError="bad" />',
  "<script>bad</script>",
  "<b>{1 + 2}</b>",
  '<PersonTag tag="x" tag="y" />',
])("unsupported executable MDX falls back: %s", (body) => {
  const f = fixture();
  try {
    f.put("content/chronicles/first.mdx", f.source(body));
    f.commit();
    expect(f.classify().profile).toBe("application");
  } finally {
    f.dispose();
  }
});
test("whole baseline diff catches an earlier application commit", () => {
  const f = fixture();
  try {
    f.put("lib/code.ts", "export const changed = true;");
    f.commit();
    f.put("content/chronicles/first.mdx", f.source("Later prose"));
    f.commit();
    expect(f.classify().profile).toBe("application");
  } finally {
    f.dispose();
  }
});
test("unpublishing, removal, missing baseline and unrelated manifest edits use application profile", () => {
  const f = fixture();
  try {
    f.put("content/chronicles/first.mdx", f.source("Draft", true));
    f.commit();
    expect(f.classify().profile).toBe("application");
    expect(f.classify("0".repeat(40)).profile).toBe("application");
    rmSync(join(f.root, "content/chronicles/first.mdx"));
    f.commit();
    expect(f.classify().profile).toBe("application");
  } finally {
    f.dispose();
  }
});
test("shared image replacement includes every supported consumer and rejects unrelated manifest changes", () => {
  const f = fixture();
  try {
    const url = "/images/optimus/shared.webp";
    f.put("public" + url, "fixture bytes");
    f.put(
      "lib/images/optimus-images-manifest.json",
      JSON.stringify({
        urls: [url],
        images: [{ src: url, width: 10, height: 10 }],
      }),
    );
    f.put("content/chronicles/first.mdx", f.source(`![First](${url})`));
    f.put("content/chronicles/second.mdx", f.source(`![Second](${url})`));
    const base = f.commit();
    f.put("public" + url, "changed bytes");
    f.commit();
    expect(f.classify(base)).toMatchObject({
      profile: "content",
      chronicles: ["first", "second"],
      assets: [url],
    });
    f.put(
      "lib/images/optimus-images-manifest.json",
      JSON.stringify({
        urls: [url],
        images: [{ src: url, width: 99, height: 10 }],
      }),
    );
    const last = f.commit();
    f.put("content/chronicles/first.mdx", f.source("Edited"));
    f.put(
      "lib/images/optimus-images-manifest.json",
      JSON.stringify({
        urls: [url],
        images: [{ src: url, width: 101, height: 10 }],
      }),
    );
    f.commit();
    expect(f.classify(last).reason).toBe("unrelated-image-manifest-change");
  } finally {
    f.dispose();
  }
});
