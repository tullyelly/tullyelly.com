// Install the reviewed tooling graph without application/Prisma lifecycle work.
import { spawnSync } from "node:child_process";
import { existsSync, symlinkSync } from "node:fs";
import { resolve } from "node:path";

for (const key of [
  "RELEASE_APP_PRIVATE_KEY",
  "VERCEL_TOKEN",
  "VERCEL_RELEASE_READ_TOKEN",
])
  if (process.env[key])
    throw new Error("Tool installation must not receive credentials");
const child = spawnSync(
  "npm",
  ["ci", "--prefix", "tools/release", "--no-audit", "--no-fund"],
  { stdio: "inherit" },
);
if (child.error || child.signal || child.status !== 0)
  process.exit(child.status || 1);
// Fresh Actions checkouts have no app dependencies. Existing local installations
// are preserved; the link is ignored and never enters the immutable source upload.
if (!existsSync("node_modules"))
  symlinkSync(resolve("tools/release/node_modules"), "node_modules", "dir");
