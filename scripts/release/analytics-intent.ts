import { execFileSync } from "node:child_process";
import { z } from "zod";
import { sha256 } from "./manifest";
import {
  analyticsMigrations,
  analyticsRuntimeSchema,
  type AnalyticsRuntimeState,
} from "../../lib/analytics-archive/readiness-contract";
const checked = z
  .object({
    checkedAt: z.string().datetime(),
    reference: z.string().regex(/^WU-[1-9][0-9]*$/),
  })
  .strict();
export const analyticsReadinessSchema = z
  .object({
    development: checked,
    production: checked,
    targetSha256: z.string().regex(/^[a-f0-9]{64}$/),
    migrations: z.tuple([
      z
        .object({
          filename: z.literal(analyticsMigrations[0].filename),
          checksum: z.literal(analyticsMigrations[0].checksum),
        })
        .strict(),
      z
        .object({
          filename: z.literal(analyticsMigrations[1].filename),
          checksum: z.literal(analyticsMigrations[1].checksum),
        })
        .strict(),
    ]),
    stagedCollectionAcknowledged: z.literal(true),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      Date.parse(value.development.checkedAt) >
        Date.parse(value.production.checkedAt) ||
      Date.parse(value.production.checkedAt) > Date.now()
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Manual checks must be dated development first, then production, without future evidence",
      });
  });
export const analyticsIntentSchema = z
  .object({
    version: z.literal(1),
    collectionEnabled: z.boolean(),
    manualReadiness: analyticsReadinessSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.collectionEnabled && !value.manualReadiness)
      ctx.addIssue({
        code: "custom",
        message:
          "Enabled analytics requires reviewed manual development/production readiness",
      });
  });
export type AnalyticsIntent = z.infer<typeof analyticsIntentSchema>;
export function readAnalyticsIntent(commit: string) {
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw new Error("code.analytics-intent-revision");
  const bytes = execFileSync("git", [
    "show",
    `${commit}:releases/analytics-state.json`,
  ]);
  for (const migration of analyticsMigrations) {
    const original = execFileSync("git", [
      "show",
      `${commit}:db/migrations/${migration.filename}`,
    ]);
    if (sha256(original) !== migration.checksum)
      throw new Error("code.analytics-migration-drift");
  }
  return {
    intent: analyticsIntentSchema.parse(JSON.parse(bytes.toString("utf8"))),
    sha256: sha256(bytes),
  };
}
export function verifyAnalyticsRuntime(
  value: unknown,
  expected: {
    commit: string;
    collectionEnabled: boolean;
    targetSha256?: string;
  },
): AnalyticsRuntimeState {
  const state = analyticsRuntimeSchema.parse(value);
  if (
    state.commitSha !== expected.commit ||
    state.collectionEnabled !== expected.collectionEnabled
  )
    throw new Error("code.analytics-runtime-mismatch");
  if (
    expected.collectionEnabled &&
    (!state.readinessChecked ||
      !state.configured ||
      state.connection !== "direct" ||
      !state.schemaReady ||
      !state.ledgerReady ||
      state.targetSha256 !== expected.targetSha256)
  )
    throw new Error("code.analytics-readiness");
  return state;
}
