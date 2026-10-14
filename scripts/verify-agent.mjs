#!/usr/bin/env node
import { runStages } from "./run-stages.mjs";
import {
  sourceValidationStages,
  applicationBuildStages,
} from "./validation-stages.mjs";

await runStages([...sourceValidationStages, ...applicationBuildStages]);
