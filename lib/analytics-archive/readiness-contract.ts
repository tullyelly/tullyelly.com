import { z } from "zod";

// Immutable original migration bytes; selected analytics history only.
export const analyticsMigrations = [
  {
    filename: "076_create_analytics_archive.sql",
    checksum:
      "0d83dc262d5291906d037d0d625cdd245a182c90a924faefb146852d7a635553",
  },
  {
    filename: "077_analytics_operations.sql",
    checksum:
      "88584aa867075149dc0b7d1b984262443462493c0e446fb8c00122446128f694",
  },
] as const;
export const analyticsRuntimeSchema = z
  .object({
    version: z.literal(1),
    commitSha: z.union([
      z.string().regex(/^[a-f0-9]{40}$/),
      z.literal("unknown"),
    ]),
    collectionEnabled: z.boolean(),
    connection: z.enum(["direct", "pooled", "missing", "invalid"]),
    targetSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    configured: z.boolean(),
    readinessChecked: z.boolean(),
    schemaReady: z.boolean(),
    ledgerReady: z.boolean(),
  })
  .strict();
export type AnalyticsRuntimeState = z.infer<typeof analyticsRuntimeSchema>;
