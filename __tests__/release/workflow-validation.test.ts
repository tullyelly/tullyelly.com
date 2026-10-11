/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const workflow = ".github/workflows/credential-maintenance.yml";
function validate(file: string) {
  return spawnSync(process.execPath, ["scripts/check-workflows.mjs", file], {
    encoding: "utf8",
    timeout: 60000,
    env: { PATH: process.env.PATH, NODE_ENV: "test" },
  });
}
function fixture(source: string) {
  const root = mkdtempSync(join(tmpdir(), "workflow-context-"));
  const path = join(root, "fixture.yml");
  writeFileSync(path, source);
  try {
    return validate(path);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("real GitHub Actions-aware validation accepts every expression in the corrected maintenance workflow", () => {
  const result = validate(workflow);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("actionlint 1.7.12");
}, 60000);
test("real actionlint rejects the exact original runner.temp job-env failure", () => {
  const source = readFileSync(workflow, "utf8");
  const original = source.replace(
    "    timeout-minutes: 30\n    steps:",
    "    timeout-minutes: 30\n    env:\n      APPLICATION_DIRECTORY: ${{ runner.temp }}/maintenance-application\n    steps:",
  );
  expect(original).not.toBe(source);
  const result = fixture(original);
  expect(result.status).toBe(1);
  expect(result.stdout + result.stderr).toMatch(
    /context "runner" is not allowed here/,
  );
}, 60000);
test.each(["env", "run-name"])(
  "runner context is rejected in unsupported workflow-level %s",
  (key) => {
    const declaration =
      key === "env"
        ? "env:\n  DIRECTORY: ${{ runner.temp }}"
        : "run-name: ${{ runner.temp }}";
    const result = fixture(
      `name: Invalid context fixture\non: workflow_dispatch\n${declaration}\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo fixture\n`,
    );
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toMatch(
      /context "runner" is not allowed here/,
    );
  },
  60000,
);
test("runner paths remain in the gated consuming steps; artifact extraction and credentials are unchanged", () => {
  const source = readFileSync(workflow, "utf8");
  const maintenance = source.split("  maintenance:\n")[1];
  expect(maintenance.split("    steps:\n")[0]).not.toContain("runner.");
  expect(
    maintenance.match(
      /APPLICATION_DIRECTORY: \$\{\{ runner.temp \}\}\/maintenance-application/g,
    ),
  ).toHaveLength(2);
  expect(maintenance).toContain("environment: production-release");
  expect(maintenance).toContain(
    'python3 scripts/release/maintenance-archive.py "$RUNNER_TEMP/maintenance-prebuilt.tar" "$APPLICATION_DIRECTORY"',
  );
  expect(source.split("  maintenance:\n")[0]).not.toContain("secrets.");
  expect(
    maintenance.split(
      "      - name: Verify human approval, rotate or recover, stage and verify",
    )[0],
  ).not.toContain("secrets.");
  expect(maintenance).toContain('MAINTENANCE_PRODUCTION_APPROVED: "true"');
});
test("missing platform tools and invalid CLI arguments fail rather than skipping workflow validation", () => {
  const missing = spawnSync(
    process.execPath,
    ["scripts/check-workflows.mjs", workflow],
    { encoding: "utf8", timeout: 60000, env: { PATH: "", NODE_ENV: "test" } },
  );
  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain(
    "Could not read verified actionlint executable",
  );
  const flags = validate("--ignored.yml");
  expect(flags.status).toBe(1);
  expect(flags.stderr).toContain("not validator flags");
}, 60000);
