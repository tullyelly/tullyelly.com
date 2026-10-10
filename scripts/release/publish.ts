import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
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
