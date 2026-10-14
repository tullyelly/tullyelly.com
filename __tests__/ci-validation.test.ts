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
import { delimiter, join, resolve } from "node:path";

const sourceCommands = [
  "workflows:check",
  "prepare:content",
  "lint",
  "typecheck:prepared",
  "gen:prisma",
  "test:ci:prepared",
];

function runEntry(entry: string, failAt = "") {
  const root = mkdtempSync(join(tmpdir(), "ci-validation-"));
  const log = join(root, "commands.jsonl");
  writeFileSync(
    join(root, "npm"),
    `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify(args) + '\\n');
process.exit(args[1] === process.env.FIXTURE_FAIL_AT ? 7 : 0);
`,
    { mode: 0o700 },
  );
  try {
    const result = spawnSync(process.execPath, [resolve(entry)], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${root}${delimiter}${process.env.PATH}`,
        FIXTURE_LOG: log,
        FIXTURE_FAIL_AT: failAt,
      },
      encoding: "utf8",
      timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    const commands = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    return { result, commands };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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

test("workflow Node pins and reusable caches invalidate on relevant configuration", () => {
  const version = readFileSync(".nvmrc", "utf8").trim();
  const setup = readFileSync(".github/actions/setup/action.yml", "utf8");
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const files = [
    setup,
    ...readdirSync(".github/workflows").map((file) =>
      readFileSync(join(".github/workflows", file), "utf8"),
    ),
  ];
  const pins = files.flatMap((file) =>
    [...file.matchAll(/node-version: "([^"]+)"/g)].map((match) => match[1]),
  );
  expect(pins.length).toBeGreaterThan(1);
  expect(new Set(pins)).toEqual(new Set([version]));
  expect(workflow).toContain("uses: ./.github/actions/setup");
  expect(setup).toContain("path: .cache/eslint");
  expect(workflow).toContain("path: .next/cache");
  for (const cache of [setup, workflow]) {
    expect(cache).toContain("runner.os");
    expect(cache).toContain("runner.arch");
    expect(cache).toContain(`node${version}`);
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
