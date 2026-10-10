/** @jest-environment node */
import {
  chmodSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertReviewPublication,
  assertInstallationPushUrl,
  installationGitEnvironment,
  readSecureAppKey,
} from "@/scripts/release/publish";

test("publication refuses production branches and stale commits", () => {
  const sha = "a".repeat(40);
  expect(() => assertReviewPublication("main", sha, sha)).toThrow();
  expect(() =>
    assertReviewPublication("cipher/analytics-archive", sha, "b".repeat(40)),
  ).toThrow();
  expect(() =>
    assertReviewPublication("cipher/analytics-archive", sha, sha),
  ).not.toThrow();
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
