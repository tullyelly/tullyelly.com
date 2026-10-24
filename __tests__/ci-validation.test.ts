/** @jest-environment node */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sourceCommands = [
  "workflows:check",
  "prepare:content",
  "lint",
  "typecheck:prepared",
  "gen:prisma",
  "test:ci:prepared",
];

interface StageObservation {
  args: string[];
  skipDb?: string;
  fixtureValue?: string;
}

interface StageReport {
  event: string;
  label: string;
  durationMs: number;
  outcome: string;
}

function runFixture(
  args: string[],
  failAt = "",
  env: Partial<NodeJS.ProcessEnv> = {},
) {
  const root = mkdtempSync(join(tmpdir(), "ci-validation-"));
  const log = join(root, "commands.jsonl");
  const report = join(root, "report.jsonl");
  const npmCli = join(root, "fixture npm.cjs");
  writeFileSync(
    npmCli,
    `const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({args, skipDb: process.env.SKIP_DB, fixtureValue: process.env.STAGE_FIXTURE}) + '\\n');
process.exit(args[1] === process.env.FIXTURE_FAIL_AT ? 7 : 0);
`,
  );
  try {
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      env: {
        ...process.env,
        ...env,
        npm_execpath: npmCli,
        FIXTURE_LOG: log,
        FIXTURE_FAIL_AT: failAt,
        RELEASE_REPORT_PATH: report,
      },
      encoding: "utf8",
      timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    const observations: StageObservation[] = existsSync(log)
      ? readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line))
      : [];
    const reports: StageReport[] = existsSync(report)
      ? readFileSync(report, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line))
      : [];
    return {
      result,
      commands: observations.map((observation) => observation.args),
      observations,
      reports,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runEntry(
  entry: string,
  failAt = "",
  env: Partial<NodeJS.ProcessEnv> = {},
) {
  return runFixture([resolve(entry)], failAt, env);
}

function runStageSource(source: string, env: Partial<NodeJS.ProcessEnv> = {}) {
  const runner = pathToFileURL(resolve("scripts/run-stages.mjs")).href;
  return runFixture(
    [
      "--input-type=module",
      "--eval",
      `import { runStages } from ${JSON.stringify(runner)}; ${source}`,
    ],
    "",
    env,
  );
}

test.each([
  ["scripts/verify-source.mjs", sourceCommands],
  ["scripts/verify-agent.mjs", [...sourceCommands, "build:next"]],
  ["scripts/build-validated.mjs", ["build:next"]],
  [
    "scripts/prepare-content.mjs",
    ["gen:build-info", "gen:images-manifest", "content:build"],
  ],
])(
  "%s runs the required stages once with existing timing",
  (entry, expected) => {
    const { result, commands } = runEntry(entry);
    expect(result.status).toBe(0);
    expect(commands).toEqual(expected.map((script) => ["run", script]));
    expect(result.stdout).toMatch(/completed in \d+\.\ds/);
    expect(result.stdout).toMatch(/All stages completed in \d+\.\ds/);
  },
);

test.each(["true", "false", undefined])(
  "source stages preserve inherited SKIP_DB=%s while the build is always guarded",
  (flag) => {
    const { result, observations } = runEntry("scripts/verify-agent.mjs", "", {
      SKIP_DB: flag,
    });
    expect(result.status).toBe(0);
    expect(observations.slice(0, -1).map((stage) => stage.skipDb)).toEqual(
      sourceCommands.map(() => flag),
    );
    expect(observations.at(-1)?.skipDb).toBe("true");
  },
);

test("stage overrides remain in the child and npm arguments stay literal", () => {
  const { result, observations } = runStageSource(
    `await runStages([
      ['override', 'npm.cmd', ['run', 'literal $(command); value'], {SKIP_DB: 'true', STAGE_FIXTURE: 'child'}],
      ['inherited', 'npm', ['run', 'later']],
    ]);
    if (process.env.SKIP_DB !== 'false' || process.env.STAGE_FIXTURE !== 'parent') process.exit(9);`,
    { SKIP_DB: "false", STAGE_FIXTURE: "parent" },
  );
  expect(result.status).toBe(0);
  expect(observations).toEqual([
    {
      args: ["run", "literal $(command); value"],
      skipDb: "true",
      fixtureValue: "child",
    },
    {
      args: ["run", "later"],
      skipDb: "false",
      fixtureValue: "parent",
    },
  ]);
});

test("stage reports retain success and failure timings without environment values", () => {
  const { result, reports } = runEntry("scripts/verify-agent.mjs", "lint", {
    STAGE_FIXTURE: "private-fixture-value",
  });
  expect(result.status).toBe(7);
  expect(reports).toHaveLength(3);
  for (const report of reports) {
    expect(report).toEqual({
      event: "stage",
      label: expect.any(String),
      durationMs: expect.any(Number),
      outcome: expect.stringMatching(/^(success|failure)$/),
    });
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
  }
  expect(reports.map((report) => report.outcome)).toEqual([
    "success",
    "success",
    "failure",
  ]);
  expect(JSON.stringify(reports)).not.toContain("private-fixture-value");
});

test("a missing executable fails promptly with a bounded diagnostic and report", () => {
  const { result, reports } = runStageSource(
    `await runStages([
      ['missing executable', 'tullyelly-nonexistent-command', []],
      ['must not run', 'npm', ['run', 'later']],
    ]);`,
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("command could not start (ENOENT)");
  expect(result.stdout).not.toContain("must not run");
  expect(reports).toEqual([
    {
      event: "stage",
      label: "missing executable",
      durationMs: expect.any(Number),
      outcome: "failure",
    },
  ]);
});

test("a signalled stage stops subsequent commands and records failure", () => {
  const { result, reports } = runStageSource(
    `await runStages([
      ['terminated', process.execPath, ['-e', 'process.kill(process.pid, "SIGTERM")']],
      ['must not run', 'npm', ['run', 'later']],
    ]);`,
  );
  expect(result.status).toBe(1);
  expect(result.stdout).not.toContain("must not run");
  expect(reports).toEqual([
    {
      event: "stage",
      label: "terminated",
      durationMs: expect.any(Number),
      outcome: "failure",
    },
  ]);
});

test.each(["lint", "test:ci:prepared"])(
  "full verification stops before the build when %s fails",
  (failAt) => {
    const { result, commands } = runEntry("scripts/verify-agent.mjs", failAt);
    expect(result.status).toBe(7);
    expect(commands).toEqual(
      sourceCommands
        .slice(0, sourceCommands.indexOf(failAt) + 1)
        .map((script) => ["run", script]),
    );
    expect(result.stderr).toMatch(/failed after \d+\.\ds/);
    expect(result.stdout).not.toContain("All stages completed");
  },
);

test("both status contexts retain a blocking application-wide gate with one coverage owner", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const [guardrails, coverage] = workflow.split("  coverage:\n");
  expect(guardrails).toContain("name: Lint, test, build");
  expect(guardrails).toContain("run: npm run verify:source");
  expect(guardrails).toContain("run: npm run build:validated");
  expect(guardrails).toContain("npm run security-headers:check");
  expect(guardrails).toContain('SKIP_DB: "true"');
  expect(guardrails).not.toMatch(/continue-on-error|paths-ignore|paths:/);
  expect(guardrails).toContain("name: coverage-lcov");
  expect(guardrails).toContain("path: coverage/lcov.info");
  expect(guardrails).toContain("if-no-files-found: error");
  expect(coverage).toContain("name: coverage");
  expect(coverage).toContain("needs: guardrails");
  expect(coverage).toContain("if: ${{ always() }}");
  expect(coverage).not.toMatch(/npm|checkout/);
  expect(existsSync(".github/workflows/coverage.yml")).toBe(false);

  const gate = coverage.match(/run: (.+)/)?.[1];
  expect(gate).toBeDefined();
  for (const status of ["success", "failure", "cancelled", "skipped", ""]) {
    const result = spawnSync("bash", ["-c", gate!], {
      env: { ...process.env, VALIDATION_RESULT: status },
    });
    expect(result.status).toBe(status === "success" ? 0 : 1);
  }
});

test("full coverage retains thresholds, while smoke remains available separately", () => {
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  expect(scripts["test:ci:prepared"]).toBe("npm run test:coverage:ci");
  expect(scripts["test:coverage:ci"]).toContain("--runInBand --coverage");
  expect(scripts["test:coverage:ci"]).not.toMatch(
    /findRelated|testPath|changed/,
  );
  expect(scripts["test:smoke"]).toBe("node scripts/jest-related-smoke.mjs");
  expect(scripts.verify).toBe("npm run verify:agent");
  const config = readFileSync("jest.config.cjs", "utf8");
  for (const [metric, threshold] of Object.entries({
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85,
  })) {
    expect(config).toContain(`${metric}: ${threshold}`);
  }
});

test("CI and release workflows share a precise Node baseline and immutable Actions", () => {
  const version = readFileSync(".nvmrc", "utf8").trim();
  const setup = readFileSync(".github/actions/setup/action.yml", "utf8");
  const workflows = readdirSync(".github/workflows").map((file) =>
    readFileSync(join(".github/workflows", file), "utf8"),
  );
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  for (const file of [setup, ...workflows]) {
    const externalUses = [...file.matchAll(/^\s*(?:- )?uses: (\S+)/gm)]
      .map((match) => match[1])
      .filter((action) => !action.startsWith("./"));
    for (const action of externalUses) {
      expect(action).toMatch(/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/);
    }
    const nodeSetups = externalUses.filter((action) =>
      action.startsWith("actions/setup-node@"),
    );
    const nodeFiles = [...file.matchAll(/node-version-file: "([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(nodeFiles).toEqual(nodeSetups.map(() => ".nvmrc"));
    expect(file).not.toMatch(/^\s*node-version:[ \t]+\S/m);
  }
  const runners = workflows.flatMap((file) =>
    [...file.matchAll(/^\s*runs-on: (.+)$/gm)].map((match) => match[1]),
  );
  expect(runners.length).toBeGreaterThan(1);
  expect(new Set(runners)).toEqual(new Set(["ubuntu-24.04"]));
});

test("reusable caches invalidate on the resolved Node version and configuration", () => {
  const setup = readFileSync(".github/actions/setup/action.yml", "utf8");
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  expect(workflow).toContain("uses: ./.github/actions/setup");
  expect(workflow).toContain("id: setup");
  expect(setup).toContain("id: node");
  expect(setup).toContain("value: ${{ steps.node.outputs.node-version }}");
  expect(setup).toContain("-node${{ steps.node.outputs.node-version }}-");
  expect(workflow).toContain("-node${{ steps.setup.outputs.node-version }}-");
  expect(setup).toContain("path: .cache/eslint");
  expect(workflow).toContain("path: .next/cache");
  for (const cache of [setup, workflow]) {
    expect(cache).toContain("runner.os");
    expect(cache).toContain("runner.arch");
    expect(cache).toContain("'.nvmrc'");
    expect(cache).toContain("'package-lock.json'");
    expect(cache).toContain("'tsconfig.json'");
    expect(cache).toContain("github.sha");
    expect(cache).toContain("restore-keys:");
  }
  expect(setup).toContain("'eslint-rules/**'");
  expect(workflow).toContain("'next.config.*'");
  expect(workflow).toContain("'contentlayer.config.*'");
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  expect(scripts.lint).toContain("--cache-strategy content");
});

test.each(["1", "0", ""])(
  "Turbopack build cache is explicitly enabled only with NEXT_BUILD_CACHE=%s",
  (flag) => {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        'import config from "./next.config.mjs"; console.log(JSON.stringify(config.experimental.turbopackFileSystemCacheForBuild));',
      ],
      {
        encoding: "utf8",
        timeout: 10000,
        env: {
          ...process.env,
          NODE_ENV: "production",
          NEXT_BUILD_CACHE: flag,
          SKIP_DB: "true",
        },
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(String(flag === "1"));
  },
);
