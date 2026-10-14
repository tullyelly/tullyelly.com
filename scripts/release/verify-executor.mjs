// No npm dependencies or protected credentials are needed to verify the executor.
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
let invariant;
try {
  const expected = process.env.EXECUTOR_SHA256 ?? "";
  const actual = createHash("sha256")
    .update(readFileSync(".cache/release-tools/production-release.cjs"))
    .digest("hex");
  if (!/^[a-f0-9]{64}$/.test(expected) || actual !== expected)
    invariant = "code.executor-digest";
} catch {
  invariant = "code.executor-unavailable";
}
if (invariant) {
  const diagnostic = {
    guard: "artifact.executor",
    category: "invariant",
    invariant,
  };
  if (process.env.RELEASE_REPORT_PATH)
    appendFileSync(
      process.env.RELEASE_REPORT_PATH,
      JSON.stringify({ event: "failure", diagnostic }) + "\n",
    );
  console.error(
    JSON.stringify({ event: "code-release-failure", ...diagnostic }),
  );
  process.exitCode = 1;
}
