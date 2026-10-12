/** Provider orchestration has no database API, migration runner or credential mutator. */
import type { CodeManifest } from "./code-manifest";
import { verifyReleaseDeploymentIdentity } from "./manifest";

export type CodeDeployment = {
  id: string;
  url: string;
  projectId: string;
  target: string;
  readyState: string;
  meta?: Record<string, unknown>;
};
export interface CodeProviders {
  guard(allowed: string[]): Promise<string>;
  deployment(id: string): Promise<CodeDeployment>;
  lookup(): Promise<CodeDeployment | undefined>;
  stage(): Promise<CodeDeployment>;
  promote(id: string): Promise<void>;
  rollback(id: string): Promise<void>;
  health(d: CodeDeployment, publicDomain: boolean): Promise<void>;
}
export async function executeCodeRelease(
  m: CodeManifest,
  manifestDigest: string,
  buildDigest: string,
  p: CodeProviders,
) {
  await p.guard([m.vercel.productionDeploymentId]);
  if (m.operation === "rollback") {
    if (!m.rollback) throw new Error("code.rollback-binding");
    const d = await p.deployment(m.rollback.deploymentId);
    if (
      d.id !== m.rollback.deploymentId ||
      d.projectId !== m.vercel.projectId ||
      d.target !== "production" ||
      d.readyState !== "READY" ||
      (d.meta?.githubCommitSha ?? d.meta?.releaseSha) !==
        m.rollback.applicationSha
    )
      throw new Error("code.rollback-identity");
    await p.health(d, false);
    await p.guard([m.vercel.productionDeploymentId]);
    // Exactly one mutation. Ambiguous outcomes are verified, never blindly retried.
    let failed = false;
    try {
      await p.rollback(d.id);
    } catch {
      failed = true;
    }
    const current = await p.guard([m.vercel.productionDeploymentId, d.id]);
    if (current !== d.id)
      throw new Error(
        failed
          ? "code.rollback-outcome-unresolved"
          : "code.rollback-not-assigned",
      );
    await p.health(d, true);
    return d.id;
  }
  let target = await p.lookup();
  if (!target) {
    try {
      target = await p.stage();
    } catch {
      // A process timeout/error can follow a successful write.
      target = await p.lookup();
      if (!target) throw new Error("code.stage-outcome-unresolved");
    }
  }
  verifyReleaseDeploymentIdentity(target, m, manifestDigest, buildDigest);
  await p.health(target, false);
  const current = await p.guard([m.vercel.productionDeploymentId, target.id]);
  if (current !== target.id) {
    let failed = false;
    try {
      await p.promote(target.id);
    } catch {
      failed = true;
    }
    const after = await p.guard([m.vercel.productionDeploymentId, target.id]);
    if (after !== target.id)
      throw new Error(
        failed
          ? "code.promote-outcome-unresolved"
          : "code.promote-not-assigned",
      );
  }
  await p.health(target, true);
  return target.id;
}
