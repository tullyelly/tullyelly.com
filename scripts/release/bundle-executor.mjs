// Resolve only the lockfile-installed esbuild used by tsx; never download tools.
import { createRequire, isBuiltin } from "node:module";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { build } = require(
  require.resolve("esbuild", { paths: [require.resolve("tsx")] }),
);
mkdirSync(".cache/release-tools", { recursive: true });
const output = ".cache/release-tools/production-release.cjs";
async function bundle(entry, outfile) {
  const result = await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    logLevel: "silent",
    metafile: true,
  });
  if (
    Object.values(result.metafile.outputs).some((file) =>
      file.imports.some((entry) => entry.external && !isBuiltin(entry.path)),
    )
  )
    throw new Error("Release executor contains an unbundled dependency");
}
const rollback = process.env.RELEASE_EXECUTOR_KIND === "rollback";
if (process.env.RELEASE_EXECUTOR_KIND && !rollback)
  throw new Error("Unsupported release executor");
await bundle(
  rollback ? "scripts/production-rollback.ts" : "scripts/production-release.ts",
  output,
);
if (!rollback)
  await bundle(
    "scripts/release/prepare-evidence.ts",
    ".cache/release-tools/prepare-evidence.cjs",
  );
const digest = createHash("sha256").update(readFileSync(output)).digest("hex");
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `executor_sha256=${digest}\n`);
console.log(`Credential-free release executor SHA-256: ${digest}`);
