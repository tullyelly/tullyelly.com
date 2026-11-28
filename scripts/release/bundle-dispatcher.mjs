import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { build } = require(
  require.resolve("esbuild", { paths: [require.resolve("tsx")] }),
);
mkdirSync(".cache/release-tools", { recursive: true });
await build({
  entryPoints: ["scripts/release-dispatch.ts"],
  outfile: ".cache/release-tools/release-dispatch.cjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  logLevel: "silent",
});
