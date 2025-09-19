#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const summaryPath = resolve(
  process.cwd(),
  process.argv[2] ?? "coverage/coverage-summary.json",
);

if (!existsSync(summaryPath)) {
  throw new Error(`Coverage summary not found at ${summaryPath}`);
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
const totals = summary.total ?? {};
const metrics = {
  lines: totals.lines?.pct ?? 0,
  statements: totals.statements?.pct ?? 0,
  functions: totals.functions?.pct ?? 0,
  branches: totals.branches?.pct ?? 0,
};

const report = `Coverage summary: lines ${metrics.lines.toFixed(2)}%, statements ${metrics.statements.toFixed(2)}%, functions ${metrics.functions.toFixed(2)}%, branches ${metrics.branches.toFixed(2)}%`;
console.log(report);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Coverage\n\n- Lines: ${metrics.lines.toFixed(2)}%\n- Statements: ${metrics.statements.toFixed(2)}%\n- Functions: ${metrics.functions.toFixed(2)}%\n- Branches: ${metrics.branches.toFixed(2)}%\n`,
  );
}

const minimum = Number(process.env.COVERAGE_MINIMUM ?? 80);
if (Number.isNaN(minimum)) {
  throw new Error(
    `Invalid COVERAGE_MINIMUM value: ${process.env.COVERAGE_MINIMUM}`,
  );
}

if (metrics.lines < minimum) {
  throw new Error(
    `Line coverage ${metrics.lines.toFixed(2)}% is below the ${minimum}% threshold.`,
  );
}
