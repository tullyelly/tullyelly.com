/** Code-only releases never accept a migration or a database credential. */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { releaseManifestSchema, settingsDigest, sha256 } from "./manifest";

export const PRODUCTION_DATABASE_HOST = [
  "ep-jolly-flower-ae4bmy06",
  "c-2.us-east-2.aws.neon.tech",
].join(".");

const sha = z.string().regex(/^[a-f0-9]{40}$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const codeManifestSchema = z
  .object({
    version: z.literal(2),
    kind: z.literal("code-only"),
    operation: z.enum(["deploy", "rollback"]),
    commit: sha,
    vercel: releaseManifestSchema.shape.vercel
      .extend({
        projectId: z.literal("prj_lyZDCv46lEtMMZ4mCsuhjxxc0ACU"),
        teamId: z.literal("team_pB5TcLa7apLtPAiVrRbcjBG3"),
      })
      .strict(),
    collectionEnabled: z.literal(false),
    buildEnvironment: z.record(
      z.string().regex(/^NEXT_PUBLIC_[A-Z0-9_]+$/),
      z.string(),
    ),
    schemaCompatibility: z
      .object({
        checkedAt: z.string().datetime(),
        checkedBy: z.literal("tullyelly"),
        evidenceUrl: z.string().url().startsWith("https://"),
        previousApplicationSha: sha,
        databaseHost: z.literal(PRODUCTION_DATABASE_HOST),
        database: z.literal("tullyelly_db"),
        method: z.enum([
          "unchanged-database-contract",
          "read-only-catalog-check",
        ]),
        requiredObjects: z.array(z.string().min(1)).max(500),
        missingObjects: z.array(z.string()).max(0),
        compatible: z.literal(true),
        rollbackCompatible: z.literal(true),
      })
      .strict(),
    rollback: z
      .object({
        deploymentId: z.string().regex(/^dpl_[A-Za-z0-9]+$/),
        applicationSha: sha,
        // Explicit owner verification of retained deployment env; no secret retrieval.
        collectionDisabledVerified: z.literal(true),
      })
      .strict()
      .optional(),
  })
  .strict();
export type CodeManifest = z.infer<typeof codeManifestSchema>;
export function validateCodeManifest(
  value: unknown,
  now = Date.now(),
): CodeManifest {
  const m = codeManifestSchema.parse(value);
  if (settingsDigest(m.vercel.settings) !== m.vercel.settingsSha256)
    throw new Error("code.settings-digest");
  const age = now - Date.parse(m.schemaCompatibility.checkedAt);
  if (age < 0 || age > 86400000)
    throw new Error("code.schema-evidence-expired");
  if ((m.operation === "rollback") !== Boolean(m.rollback))
    throw new Error("code.rollback-binding");
  if (m.rollback?.deploymentId === m.vercel.productionDeploymentId)
    throw new Error("code.rollback-target-is-current");
  if (
    m.schemaCompatibility.method === "read-only-catalog-check" &&
    !m.schemaCompatibility.requiredObjects.length
  )
    throw new Error("code.schema-check-empty");
  return m;
}
export function loadCodeManifest(
  path: string,
  expectedDigest: string,
  expectedCommit: string,
) {
  digest.parse(expectedDigest);
  sha.parse(expectedCommit);
  const bytes = readFileSync(path);
  if (sha256(bytes) !== expectedDigest) throw new Error("code.manifest-digest");
  const m = validateCodeManifest(JSON.parse(bytes.toString("utf8")));
  if (m.commit !== expectedCommit) throw new Error("code.manifest-sha");
  return m;
}
