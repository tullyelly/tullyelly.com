#!/usr/bin/env node
import { runStages } from "./run-stages.mjs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

await runStages([
  ["Preparing generated content", npm, ["run", "prepare:content"]],
  ["Linting", npm, ["run", "lint"]],
  ["Typechecking", npm, ["run", "typecheck:prepared"]],
  ["Generating Prisma client", npm, ["run", "gen:prisma"]],
  ["Running Jest validation", npm, ["run", "test:ci:prepared"]],
  ["Starting Next production build", npm, ["run", "build:next"]],
]);
