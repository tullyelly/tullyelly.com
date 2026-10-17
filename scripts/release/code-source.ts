/** Export only the approved Git tree; validation output and local files cannot enter an upload. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function sourceEnvironment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    GIT_NO_REPLACE_OBJECTS: "1",
  };
}

function assertRevision(commit: string) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("code.application-sha");
  const resolved = execFileSync("git", ["rev-parse", `${commit}^{commit}`], {
    encoding: "utf8",
    env: sourceEnvironment(),
  }).trim();
  if (resolved !== commit) throw new Error("code.application-sha");
  // Git symlinks/submodules can resolve outside the immutable export at upload time.
  const tree = execFileSync("git", ["ls-tree", "-rz", "--full-tree", commit], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: sourceEnvironment(),
  });
  if (
    tree
      .split("\0")
      .filter(Boolean)
      .some(
        (entry) =>
          !/^100(?:644|755) blob [a-f0-9]{40}\t/.test(entry) ||
          /\t(?:release-source\.json$|\.vercel\/)/.test(entry),
      )
  )
    throw new Error("code.source-unsafe-tree");
}
function archive(commit: string, directory: string) {
  assertRevision(commit);
  const path = join(directory, "approved-source.tar");
  execFileSync("git", ["archive", "--format=tar", `--output=${path}`, commit], {
    stdio: ["ignore", "pipe", "pipe"],
    env: sourceEnvironment(),
  });
  const hash = createHash("sha256"),
    bytes = Buffer.alloc(1024 * 1024),
    fd = openSync(path, "r");
  try {
    for (;;) {
      const size = readSync(fd, bytes, 0, bytes.length, null);
      if (!size) break;
      hash.update(bytes.subarray(0, size));
    }
  } finally {
    closeSync(fd);
  }
  return { path, sha256: hash.digest("hex") };
}
export function sourceArchiveDigest(commit: string) {
  const directory = mkdtempSync(join(tmpdir(), "release-source-digest-"));
  try {
    return archive(commit, directory).sha256;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
export function createCleanSource(options: {
  commit: string;
  sha256: string;
  teamId: string;
  projectId: string;
  temporaryDirectory: string;
}) {
  const directory = mkdtempSync(
    join(options.temporaryDirectory, "approved-source-"),
  );
  try {
    const exported = archive(options.commit, directory);
    if (exported.sha256 !== options.sha256)
      throw new Error("code.source-digest");
    const source = join(directory, "source");
    mkdirSync(source);
    execFileSync("tar", ["-xf", exported.path, "-C", source], {
      stdio: ["ignore", "pipe", "pipe"],
      env: sourceEnvironment(),
    });
    mkdirSync(join(source, ".vercel"));
    writeFileSync(
      join(source, ".vercel/project.json"),
      JSON.stringify({ orgId: options.teamId, projectId: options.projectId }),
    );
    // This non-secret receipt travels with the source, then becomes application build info.
    // It is never an environment override or provider-only claim about application revision.
    writeFileSync(
      join(source, "release-source.json"),
      JSON.stringify({
        commit: options.commit,
        archiveSha256: exported.sha256,
      }),
    );
    return {
      directory: source,
      dispose: () => rmSync(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}
