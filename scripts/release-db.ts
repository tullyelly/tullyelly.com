import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import {
  executeRelease,
  releaseManifestSchema,
  releaseTarget,
} from "./release-db-core";

async function main() {
  const [mode, manifestFlag, manifestPath, commitFlag, commit] =
    process.argv.slice(2);
  if (
    !["check", "apply", "verify"].includes(mode) ||
    manifestFlag !== "--manifest" ||
    !manifestPath ||
    commitFlag !== "--commit" ||
    !commit ||
    process.argv.slice(2).length !== 5
  )
    throw new Error(
      "Usage: tsx scripts/release-db.ts <check|apply|verify> --manifest <path> --commit <SHA>",
    );
  const manifest = releaseManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (head !== commit || manifest.commit !== commit)
    throw new Error(
      "Checkout and manifest must match the exact approved commit.",
    );
  if (
    execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
      encoding: "utf8",
    }).trim()
  )
    throw new Error(
      "Release checkout has tracked changes; refusing database access.",
    );
  if (
    mode === "apply" &&
    manifest.environment === "production" &&
    process.env.RELEASE_PRODUCTION_APPROVED !== "true"
  )
    throw new Error(
      "Production writes require the protected production workflow approval.",
    );
  const db = new Client({
    connectionString: releaseTarget(manifest, process.env),
    connectionTimeoutMillis: 5000,
    statement_timeout: 65000,
  });
  try {
    await db.connect();
    console.log(
      JSON.stringify(
        await executeRelease(
          db,
          manifest,
          mode as "check" | "apply" | "verify",
        ),
      ),
    );
  } finally {
    await db.end();
  }
}
main().catch(() => {
  console.error(
    "Release database operation stopped. Check target, approved manifest and ledger; credentials and driver errors are omitted.",
  );
  process.exitCode = 1;
});
