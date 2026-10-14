// Reuse the repository's stage timer for the release's fixed command boundaries.
import { runStages } from "../run-stages.mjs";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const executor = [
  process.execPath,
  [".cache/release-tools/production-release.cjs"],
];
const cliVersion = "63.1.2";
const stages = {
  install: [
    ["Installing source dependencies", npm, ["ci"]],
    [
      "Installing release CLI",
      npm,
      ["install", "--global", `vercel@${cliVersion}`],
    ],
  ],
  "install-cli": [
    [
      "Installing release CLI",
      npm,
      ["install", "--global", `vercel@${cliVersion}`],
    ],
  ],
  // Fixtures execute child processes; only the outer validation duration belongs
  // in the release report. Existing substage console timing remains available.
  source: [
    [
      "Validating release source",
      npm,
      ["run", "verify:source"],
      { RELEASE_REPORT_PATH: "" },
    ],
  ],
  bundle: [
    [
      "Bundling release executor",
      process.execPath,
      ["scripts/release/bundle-executor.mjs"],
    ],
  ],
  executor: [
    [
      "Verifying release executor",
      process.execPath,
      ["scripts/release/verify-executor.mjs"],
    ],
  ],
  plan: [
    [
      "Binding release plan",
      npm,
      ["exec", "--", "tsx", "scripts/production-release.ts", "prepare"],
    ],
  ],
  build: [
    [
      "Building canonical production artifact",
      npm,
      ["exec", "--", "tsx", "scripts/production-release.ts", "build"],
    ],
  ],
  restore: [
    ["Verifying downloaded artifact", executor[0], [...executor[1], "restore"]],
  ],
  prepare: [
    ["Rechecking release plan", executor[0], [...executor[1], "prepare"]],
  ],
  check: [
    [
      "Checking approved production target",
      executor[0],
      [...executor[1], "check"],
    ],
  ],
  deploy: [
    [
      "Executing approved production operation",
      executor[0],
      [...executor[1], "deploy"],
    ],
  ],
};
const selected = stages[process.argv[2]];
if (!selected) throw new Error("Unsupported release stage");
if (process.env.VERCEL_CLI_VERSION !== cliVersion)
  throw new Error("Reviewed release CLI version mismatch");
await runStages(selected);
