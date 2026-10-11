import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function run(source, env = {}) {
  return spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 10_000,
  });
}

test("Jest resets an inherited build flag but permits explicit skip-mode tests", () => {
  const result = run(
    `import './jest.env.cjs';
     if (process.env.SKIP_DB !== 'false') process.exit(1);
     process.env.SKIP_DB = 'true';
     if (process.env.SKIP_DB !== 'true') process.exit(2);`,
    { SKIP_DB: "true" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("stage environment overrides do not leak into the next stage", () => {
  const result = run(
    `import { runStages } from './scripts/run-stages.mjs';
     await runStages([
       ['build', process.execPath, ['-e', 'if(process.env.SKIP_DB !== "true") process.exit(2)'], {SKIP_DB: 'true'}],
       ['test', process.execPath, ['-e', 'if(process.env.SKIP_DB !== "false") process.exit(3)']],
     ]);`,
    { SKIP_DB: "false" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("failed stages stop subsequent commands and preserve the failure status", () => {
  const result = run(`
    import { runStages } from './scripts/run-stages.mjs';
    await runStages([
      ['failure', process.execPath, ['-e', 'process.exit(7)']],
      ['must not run', process.execPath, ['-e', 'console.log("UNEXPECTED")']],
    ]);`);
  assert.equal(result.status, 7, result.stderr);
  assert.doesNotMatch(result.stdout, /UNEXPECTED/);
});

test("missing executables fail promptly with a diagnostic", () => {
  const result = run(`
    import { runStages } from './scripts/run-stages.mjs';
    await runStages([['missing command', 'tullyelly-nonexistent-command', []]]);`);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /ENOENT/);
});
