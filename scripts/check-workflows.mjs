#!/usr/bin/env node
// GitHub Actions-aware expression/context validation; no authentication or workflow execution.
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const version = "1.7.12";
// Official rhysd/actionlint release digests; update deliberately with the pinned version.
const checksums = {
  linux_x64: "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
  linux_arm64:
    "325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6",
  darwin_x64:
    "5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644",
  darwin_arm64:
    "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f",
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function validator() {
  const target = `${process.platform}_${process.arch}`;
  if (!checksums[target])
    throw new Error(
      "Workflow validation requires Linux/WSL or macOS on x64/arm64",
    );
  const architecture = process.arch === "x64" ? "amd64" : "arm64";
  const asset = `actionlint_${version}_${process.platform}_${architecture}.tar.gz`;
  const cache = resolve(".cache", "actionlint", version, target);
  mkdirSync(cache, { recursive: true });
  const archive = join(cache, asset),
    executable = join(cache, "actionlint");
  if (!existsSync(archive)) {
    console.log(
      `Downloading pinned actionlint ${version} from its official GitHub release`,
    );
    const response = await fetch(
      `https://github.com/rhysd/actionlint/releases/download/v${version}/${asset}`,
      { signal: AbortSignal.timeout(30000) },
    );
    if (!response.ok)
      throw new Error(`actionlint download failed: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (digest(bytes) !== checksums[target])
      throw new Error("actionlint archive checksum mismatch");
    const temporary = mkdtempSync(join(cache, "download-"));
    try {
      const file = join(temporary, asset);
      writeFileSync(file, bytes, { mode: 0o600 });
      renameSync(file, archive);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  }
  if (digest(readFileSync(archive)) !== checksums[target])
    throw new Error(
      "Cached actionlint archive checksum mismatch; remove its cache and retry",
    );
  // Extract only the checksum-verified executable to memory; no archive paths are installed globally.
  const extracted = spawnSync("tar", ["-xzf", archive, "-O", "actionlint"], {
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
    timeout: 10000,
  });
  if (extracted.error || extracted.status !== 0)
    throw new Error("Could not read verified actionlint executable");
  if (existsSync(executable)) {
    if (digest(readFileSync(executable)) !== digest(extracted.stdout))
      throw new Error(
        "Cached actionlint executable checksum mismatch; remove its cache and retry",
      );
  } else {
    const temporary = mkdtempSync(join(cache, "install-"));
    try {
      const file = join(temporary, "actionlint");
      writeFileSync(file, extracted.stdout, { mode: 0o755 });
      renameSync(file, executable);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  }
  chmodSync(executable, 0o755);
  return executable;
}
async function main() {
  const files = process.argv.slice(2);
  if (!files.length)
    files.push(
      ...readdirSync(".github/workflows")
        .filter((name) => /\.ya?ml$/.test(name))
        .sort()
        .map((name) => `.github/workflows/${name}`),
    );
  if (
    !files.length ||
    files.some((file) => !/\.ya?ml$/.test(file) || file.startsWith("-"))
  )
    throw new Error("Provide workflow YAML paths, not validator flags");
  const executable = await validator();
  // Keep the GitHub-aware parser, expression/type checks and action checks active.
  // Optional host-installed ShellCheck/Pyflakes are excluded for deterministic results.
  const result = spawnSync(
    executable,
    ["-shellcheck=", "-pyflakes=", ...files],
    {
      stdio: "inherit",
      timeout: 30000,
    },
  );
  if (result.error)
    throw new Error("actionlint could not complete workflow validation");
  process.exitCode = result.status ?? 1;
  if (result.status === 0)
    console.log(
      `actionlint ${version}: ${files.length} workflow file(s) passed`,
    );
}
main().catch((error) => {
  console.error(`Workflow validation failed: ${error.message}`);
  process.exitCode = 1;
});
