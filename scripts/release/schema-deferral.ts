/** Reviewed application-only compatibility evidence; never executes SQL. */
import { execFileSync } from "node:child_process";
import { z } from "zod";
import { sha256 } from "./manifest";

export const schemaDeferralPath = "releases/deferred-schema.json";
export const schemaDeferralSchema = z
  .object({
    version: z.literal(1),
    scope: z.literal("application-only"),
    baselineSha: z.string().regex(/^[a-f0-9]{40}$/),
    schemaDiffSha256: z.string().regex(/^[a-f0-9]{64}$/),
    rationale: z.string().min(1).max(2000),
  })
  .strict();

export function validateSchemaDeferral(
  value: unknown,
  baselineSha: string,
  schemaDiff: string,
) {
  const review = schemaDeferralSchema.parse(value);
  if (
    review.baselineSha !== baselineSha ||
    review.schemaDiffSha256 !== sha256(schemaDiff) ||
    !schemaDiff
  )
    throw new Error("code.sensitive-compatibility-review");
  return review;
}

export function readSchemaDeferral(baselineSha: string, commit: string) {
  for (const sha of [baselineSha, commit])
    z.string()
      .regex(/^[a-f0-9]{40}$/)
      .parse(sha);
  const git = (args: string[]) =>
    execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  if (
    git(["ls-tree", "--name-only", commit, "--", schemaDeferralPath]).trim() !==
    schemaDeferralPath
  )
    return undefined;
  return validateSchemaDeferral(
    JSON.parse(git(["show", `${commit}:${schemaDeferralPath}`])),
    baselineSha,
    git([
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--binary",
      "--full-index",
      "--no-color",
      "--unified=3",
      "--diff-algorithm=myers",
      "--no-indent-heuristic",
      "--src-prefix=a/",
      "--dst-prefix=b/",
      "--no-renames",
      baselineSha,
      commit,
      "--",
      "db/migrations",
      "db/schema",
      "prisma/schema*",
    ]),
  );
}
