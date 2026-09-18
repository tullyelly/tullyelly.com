#!/usr/bin/env node
import { runStages } from "./run-stages.mjs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

await runStages([
  ["Generating build info", npm, ["run", "gen:build-info"]],
  ["Checking image manifest", npm, ["run", "gen:images-manifest"]],
  ["Building Contentlayer", npm, ["run", "content:build"]],
]);
