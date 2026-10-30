/** @jest-environment node */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

test("hook-launched Jest cannot redirect Git fixtures into the publishing checkout", () => {
  const root = mkdtempSync(join(tmpdir(), "jest-hook-git-"));
  const outer = join(root, "publisher");
  const inner = join(root, "fixture.git");
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", outer, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  try {
    execFileSync("git", ["init", "--quiet", outer]);
    writeFileSync(
      join(outer, "guard.txt"),
      "Keep the publishing tree intact.\n",
    );
    git("add", "guard.txt");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      "guard",
    );
    const head = git("rev-parse", "HEAD");
    const tree = git("write-tree");
    const parentGitDir = join(outer, ".git");
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `
      const Module = require('node:module');
      const load = Module._load;
      Module._load = function(id, ...args) {
        if (id === 'next/jest.js') return () => () => {};
        return load.call(this, id, ...args);
      };
      require(process.env.JEST_CONFIG_UNDER_TEST);
      require('node:child_process').execFileSync('git', ['init', '--bare', '--quiet', process.env.FIXTURE_REPOSITORY]);
      console.log(JSON.stringify({
        remaining: Object.keys(process.env).filter(k => /^GIT_(DIR|WORK_TREE|INDEX_FILE|COMMON_DIR|OBJECT_DIRECTORY|PREFIX|CONFIG_COUNT|CONFIG_KEY_0|CONFIG_VALUE_0)$/.test(k)),
        globalConfig: process.env.GIT_CONFIG_GLOBAL,
        noSystem: process.env.GIT_CONFIG_NOSYSTEM,
        marker: process.env.HOOK_TEST_MARKER
      }));
    `,
      ],
      {
        encoding: "utf8",
        timeout: 10000,
        env: {
          ...process.env,
          JEST_CONFIG_UNDER_TEST: resolve("jest.config.cjs"),
          FIXTURE_REPOSITORY: inner,
          GIT_DIR: parentGitDir,
          GIT_COMMON_DIR: parentGitDir,
          GIT_WORK_TREE: outer,
          GIT_INDEX_FILE: join(parentGitDir, "index"),
          GIT_OBJECT_DIRECTORY: join(parentGitDir, "objects"),
          GIT_PREFIX: "inherited/",
          GIT_CONFIG_COUNT: "1",
          GIT_CONFIG_KEY_0: "http.extraHeader",
          GIT_CONFIG_VALUE_0: "fixture-credential-must-not-propagate",
          GIT_CONFIG_GLOBAL: "/dev/null",
          GIT_CONFIG_NOSYSTEM: "1",
          HOOK_TEST_MARKER: "preserved",
        },
      },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      remaining: [],
      globalConfig: "/dev/null",
      noSystem: "1",
      marker: "preserved",
    });
    expect(existsSync(join(inner, "HEAD"))).toBe(true);
    expect(git("rev-parse", "HEAD")).toBe(head);
    expect(git("write-tree")).toBe(tree);
    expect(git("config", "core.bare")).toBe("false");
    expect(git("status", "--porcelain")).toBe("");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
