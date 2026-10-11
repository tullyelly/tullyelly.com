import {
  lstatSync,
  readFileSync,
  realpathSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

export function assertReviewPublication(
  branch: string,
  head: string,
  approved: string,
) {
  if (
    branch !== "cipher/analytics-archive" ||
    !/^[a-f0-9]{40}$/.test(approved) ||
    head !== approved
  )
    throw new Error(
      "Only the exact prepared analytics review branch commit can be published.",
    );
}

export function readSecureAppKey(
  filename: string,
  directory = join(homedir(), ".config", "cipher-release"),
) {
  const root = resolve(directory);
  if (
    dirname(resolve(filename)) !== root ||
    realpathSync(root) !== root ||
    realpathSync(filename) !== resolve(filename)
  )
    throw new Error(
      "Use the dedicated local App key directory; symbolic links are refused.",
    );
  const folder = lstatSync(root);
  const file = lstatSync(filename);
  const uid = process.getuid?.();
  if (
    !folder.isDirectory() ||
    !file.isFile() ||
    (folder.mode & 0o077) !== 0 ||
    (file.mode & 0o077) !== 0 ||
    (uid !== undefined && (folder.uid !== uid || file.uid !== uid))
  )
    throw new Error(
      "App key requires an owned mode0700 directory and mode0600 file.",
    );
  return readFileSync(filename, "utf8");
}

export function installationGitEnvironment(
  token: string,
  source: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined> {
  const safe: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(source)) {
    if (
      !/^GIT_(TRACE|CONFIG|CURL_VERBOSE|ASKPASS)/.test(name) &&
      name !== "RELEASE_APP_PRIVATE_KEY"
    )
      safe[name] = value;
  }
  return {
    ...safe,
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_COUNT: "3",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: "",
    GIT_CONFIG_KEY_1: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_1: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
    GIT_CONFIG_KEY_2: "credential.helper",
    GIT_CONFIG_VALUE_2: "",
  };
}

export function assertInstallationPushUrl(resolved: string, expected: string) {
  if (resolved !== expected)
    throw new Error(
      "Git rewrites the App push URL; stop without changing existing Git configuration.",
    );
}

/** Resolve push rewrites in an isolated Git directory; never add a real remote. */
export function verifyInstallationPushUrl(
  url: string,
  env: NodeJS.ProcessEnv,
  cwd = process.cwd(),
  temporaryParent = tmpdir(),
) {
  const directory = mkdtempSync(join(temporaryParent, "cipher-app-check-"));
  const options = {
    cwd,
    env,
    encoding: "utf8" as const,
    stdio: "pipe" as const,
  };
  try {
    execFileSync("git", ["init", "--bare", "--template=", directory], options);
    // Preserve effective repository-specific rewrites, as well as global ones.
    let rewrites = "";
    try {
      rewrites = execFileSync(
        "git",
        [
          "config",
          "--null",
          "--get-regexp",
          "^url\\..*\\.(insteadof|pushinsteadof)$",
        ],
        options,
      );
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("status" in error) ||
        error.status !== 1
      )
        throw error;
    }
    for (const entry of rewrites.split("\0").filter(Boolean)) {
      const separator = entry.indexOf("\n");
      if (separator < 0) throw new Error("Malformed Git rewrite configuration");
      execFileSync(
        "git",
        [
          "config",
          "--file",
          join(directory, "config"),
          "--add",
          entry.slice(0, separator),
          entry.slice(separator + 1),
        ],
        options,
      );
    }
    execFileSync(
      "git",
      [
        "config",
        "--file",
        join(directory, "config"),
        "remote.cipher-app-check.url",
        url,
      ],
      options,
    );
    const resolved = execFileSync(
      "git",
      [
        "--git-dir",
        directory,
        "remote",
        "get-url",
        "--push",
        "cipher-app-check",
      ],
      options,
    ).trim();
    assertInstallationPushUrl(resolved, url);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
