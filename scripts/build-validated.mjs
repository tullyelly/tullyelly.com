#!/usr/bin/env node
import { runStages } from "./run-stages.mjs";
import { applicationBuildStages } from "./validation-stages.mjs";

// Requires verify:source in the same checkout; reuses generated content and Prisma.
await runStages(applicationBuildStages);
