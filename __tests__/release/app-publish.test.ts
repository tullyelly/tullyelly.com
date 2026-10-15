/** @jest-environment node */
import {
  chmodSync,
  readFileSync,
  readdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  verifyInstallationPushUrl,
  assertReviewPublication,
  assertInstallationPushUrl,
  installationGitEnvironment,
  readSecureAppKey,
  reviewPublicationInput,
  reviewMainAncestry,
} from "@/scripts/release/publish";

test("publication refuses production branches and stale commits", () => {
  const sha = "a".repeat(40);
  expect(() =>
    assertReviewPublication("main", sha, sha, "cipher/normal-release-repair"),
  ).toThrow();
  expect(() =>
    assertReviewPublication(
      "cipher/analytics-archive",
      sha,
      "b".repeat(40),
      "cipher/analytics-archive",
    ),
  ).toThrow();
  expect(() =>
    assertReviewPublication(
      "cipher/analytics-archive",
      sha,
      sha,
      "cipher/analytics-archive",
    ),
  ).not.toThrow();
});

test.each(["cipher/normal-release-repair", "feature/independent-review"])(
  "publication binds the explicit working branch %s and exact SHA",
  (branch) => {
    const sha = "a".repeat(40);
    expect(
      reviewPublicationInput(["publish", "--branch", branch, "--commit", sha]),
    ).toEqual({ mode: "publish", branch, sha });
    expect(() =>
      assertReviewPublication(branch, sha, sha, branch),
    ).not.toThrow();
    expect(() =>
      assertReviewPublication("cipher/unrelated", sha, sha, branch),
    ).toThrow();
  },
);
test.each([
  "main",
  "master",
  "HEAD",
  "refs/heads/cipher/review",
  "-option",
  "cipher/../main",
  "cipher/a..b",
  "cipher/a.lock",
  "cipher/a/.hidden",
  "cipher/a/",
  "cipher//review",
  "cipher/a@{1}",
  "cipher/a b",
  "cipher/a?b",
  "cipher/a:main",
  "cipher/a\nmain",
])("unsafe working ref %j is rejected before publication", (branch) => {
  expect(() =>
    reviewPublicationInput([
      "publish",
      "--branch",
      branch,
      "--commit",
      "a".repeat(40),
    ]),
  ).toThrow();
});
test("main ancestry reports behind or unavailable without changing Git history", () => {
  const root = mkdtempSync(join(tmpdir(), "review-ancestry-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
    }).trim();
  try {
    git("init", "--template=", "-b", "main");
    const commit = (message: string) =>
      git(
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.test",
        "commit",
        "--allow-empty",
        "-m",
        message,
      );
    commit("first");
    const before = git("rev-parse", "HEAD");
    commit("second");
    const main = git("rev-parse", "HEAD");
    expect(reviewMainAncestry(before, main, root)).toBe("up-to-date");
    expect(reviewMainAncestry(main, before, root)).toBe("behind");
    expect(reviewMainAncestry("f".repeat(40), before, root)).toBe(
      "unavailable",
    );
    expect(git("rev-parse", "HEAD")).toBe(main);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("Git credentials are ephemeral and existing trace/helper overrides cannot expose them", () => {
  const env = installationGitEnvironment("fixture-token", {
    GIT_TRACE: "1",
    GIT_CONFIG_COUNT: "99",
    GIT_ASKPASS: "unsafe",
    RELEASE_APP_PRIVATE_KEY: "private-fixture",
    PATH: "/usr/bin",
  });
  expect(env.PATH).toBe("/usr/bin");
  expect(env.GIT_CONFIG_COUNT).toBe("3");
  expect(env.GIT_CONFIG_VALUE_0).toBe("");
  expect(env.GIT_CONFIG_VALUE_2).toBe("");
  expect(env.GIT_TRACE).toBeUndefined();
  expect(env.GIT_ASKPASS).toBeUndefined();
  expect(env.RELEASE_APP_PRIVATE_KEY).toBeUndefined();
  expect(env.GIT_CONFIG_VALUE_0).not.toContain("fixture-token");
});
test("local App key rejects broad permissions and symbolic links", () => {
  const root = mkdtempSync(join(tmpdir(), "cipher-app-key-"));
  const file = join(root, "key.pem");
  try {
    chmodSync(root, 0o700);
    writeFileSync(file, "fixture-key", { mode: 0o600 });
    expect(readSecureAppKey(file, root)).toBe("fixture-key");
    chmodSync(file, 0o644);
    expect(() => readSecureAppKey(file, root)).toThrow("mode0600");
    chmodSync(file, 0o600);
    const linked = join(root, "linked.pem");
    symlinkSync(file, linked);
    expect(() => readSecureAppKey(linked, root)).toThrow("symbolic links");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Git URL rewrites cannot fall back to a human SSH identity", () => {
  const url = "https://github.com/tullyelly/tullyelly.com.git";
  expect(() => assertInstallationPushUrl(url, url)).not.toThrow();
  expect(() =>
    assertInstallationPushUrl(
      "git@github.com:tullyelly/tullyelly.com.git",
      url,
    ),
  ).toThrow("rewrites");
});

describe("isolated publisher remote", () => {
  const url = "https://github.com/tullyelly/tullyelly.com.git";
  let root: string;
  let repository: string;
  let temporaryParent: string;
  let env: NodeJS.ProcessEnv;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "publisher-regression-"));
    repository = join(root, "repository");
    temporaryParent = root;
    env = {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
    };
    execFileSync("git", ["init", "--bare", "--template=", repository], {
      env,
      stdio: "pipe",
    });
    execFileSync(
      "git",
      [
        "--git-dir",
        repository,
        "remote",
        "add",
        "origin",
        "git@github.com:example/existing.git",
      ],
      { env },
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  test("resolves the formerly missing remote without changing persistent configuration", () => {
    const before = readFileSync(join(repository, "config"), "utf8");
    verifyInstallationPushUrl(url, env, repository, temporaryParent);
    expect(readFileSync(join(repository, "config"), "utf8")).toBe(before);
    expect(readdirSync(root)).toEqual(["repository"]);
    expect(
      execFileSync("git", ["--git-dir", repository, "remote"], {
        env,
        encoding: "utf8",
      }).trim(),
    ).toBe("origin");
  });
  test.each(["insteadOf", "pushInsteadOf"])(
    "rejects %s rewrites and cleans up before any publication",
    (kind) => {
      execFileSync(
        "git",
        [
          "--git-dir",
          repository,
          "config",
          `url.git@github.com:.${kind}`,
          "https://github.com/",
        ],
        { env },
      );
      const before = readFileSync(join(repository, "config"), "utf8");
      expect(() =>
        verifyInstallationPushUrl(url, env, repository, temporaryParent),
      ).toThrow("rewrites");
      expect(readFileSync(join(repository, "config"), "utf8")).toBe(before);
      expect(readdirSync(root)).toEqual(["repository"]);
    },
  );
  test("cleans up when Git fails before URL verification", () => {
    expect(() =>
      verifyInstallationPushUrl(
        url,
        { ...env, PATH: "/nonexistent-fixture-path" },
        repository,
        temporaryParent,
      ),
    ).toThrow();
    expect(readdirSync(root)).toEqual(["repository"]);
  });
});
