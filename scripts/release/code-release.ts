/** Provider orchestration has no database API, migration runner or credential mutator. */
import type { CodeManifest } from "./code-manifest";
import { verifyReleaseDeploymentIdentity } from "./manifest";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
  codeGuard,
  type Diagnostic,
} from "./code-diagnostics";

export type CodeDeployment = {
  id: string;
  url: string;
  projectId: string;
  target: string;
  readyState: string;
  meta?: Record<string, unknown>;
};
export interface CodeProviders {
  reportDeployment?(deployment: CodeDeployment): void;
  reportReconciliation?(diagnostic: {
    outcome: "found";
    originalFailure: Diagnostic;
  }): void;
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
    p.reportDeployment?.(d);
    await codeGuard("health.staged", () => p.health(d, false));
    await p.guard([m.vercel.productionDeploymentId]);
    // Exactly one mutation. Ambiguous outcomes are verified, never blindly retried.
    let failure: Diagnostic | undefined;
    try {
      await codeGuard("vercel.rollback", () => p.rollback(d.id));
    } catch (error) {
      failure = classifyCodeFailure("vercel.rollback", error);
    }
    const current = await p.guard([m.vercel.productionDeploymentId, d.id]);
    if (current !== d.id)
      throw outcomeError(
        "vercel.rollback",
        failure
          ? "code.rollback-outcome-unresolved"
          : "code.rollback-not-assigned",
        failure,
      );
    if (failure)
      p.reportReconciliation?.({ outcome: "found", originalFailure: failure });
    await codeGuard("health.public", () => p.health(d, true));
    return d.id;
  }
  let target = await codeGuard("vercel.lookup", () => p.lookup());
  if (!target) {
    try {
      target = await codeGuard("vercel.stage", () => p.stage());
    } catch (error) {
      // A process timeout/error can follow a successful write. Preserve both observations.
      const originalFailure = classifyCodeFailure("vercel.stage", error);
      try {
        target = await codeGuard("vercel.lookup", () => p.lookup());
      } catch (lookupError) {
        throw new CodeDiagnosticError({
          guard: "vercel.stage",
          category: "invariant",
          invariant: "code.stage-reconciliation-failed",
          originalFailure,
          reconciliation: "failed",
          reconciliationFailure: classifyCodeFailure(
            "vercel.lookup",
            lookupError,
          ),
        });
      }
      if (!target)
        throw new CodeDiagnosticError({
          guard: "vercel.stage",
          category: "invariant",
          invariant: "code.stage-outcome-unresolved",
          originalFailure,
          reconciliation: "not-found",
        });
      p.reportReconciliation?.({ outcome: "found", originalFailure });
    }
  }
  await codeGuard("vercel.identity", () =>
    verifyReleaseDeploymentIdentity(target, m, manifestDigest, buildDigest),
  );
  p.reportDeployment?.(target);
  // --skip-domain is a required staging property, verified independently of
  // CLI success. An unexpected assignment must stop before promotion.
  await p.guard([m.vercel.productionDeploymentId]);
  await codeGuard("health.staged", () => p.health(target, false));
  const current = await p.guard([m.vercel.productionDeploymentId]);
  if (current !== target.id) {
    let failure: Diagnostic | undefined;
    try {
      await codeGuard("vercel.promote", () => p.promote(target.id));
    } catch (error) {
      failure = classifyCodeFailure("vercel.promote", error);
    }
    const after = await p.guard([m.vercel.productionDeploymentId, target.id]);
    if (after !== target.id)
      throw outcomeError(
        "vercel.promote",
        failure
          ? "code.promote-outcome-unresolved"
          : "code.promote-not-assigned",
        failure,
      );
    if (failure)
      p.reportReconciliation?.({ outcome: "found", originalFailure: failure });
  }
  await codeGuard("health.public", () => p.health(target, true));
  return target.id;
}

function outcomeError(
  guard: "vercel.promote" | "vercel.rollback",
  invariant: string,
  originalFailure?: Diagnostic,
) {
  const error = new CodeDiagnosticError({
    guard,
    category: "invariant",
    invariant,
    originalFailure,
    reconciliation: "not-found",
  });
  error.message = invariant;
  return error;
}
