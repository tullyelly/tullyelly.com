const npm = process.platform === "win32" ? "npm.cmd" : "npm";

// Both entry points use the same application-wide validation and stage timing.
export const sourceValidationStages = [
  ["Validating GitHub Actions workflows", npm, ["run", "workflows:check"]],
  ["Preparing generated content", npm, ["run", "prepare:content"]],
  ["Linting", npm, ["run", "lint"]],
  ["Typechecking", npm, ["run", "typecheck:prepared"]],
  ["Generating Prisma client", npm, ["run", "gen:prisma"]],
  ["Running Jest validation", npm, ["run", "test:ci:prepared"]],
];

export const applicationBuildStages = [
  ["Starting Next production build", npm, ["run", "build:next"]],
];
