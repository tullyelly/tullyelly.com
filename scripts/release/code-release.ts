/** Provider orchestration has no database API, migration runner or credential mutator. */
import { confirmedCloudflareChallenge } from "./health-observation.mjs";
import type { CodeManifest } from "./code-manifest";
import type { NativeCodeEvidence } from "./native-evidence";
import { verifyReleaseDeploymentIdentity } from "./manifest";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
  codeGuard,
  type Diagnostic,
} from "./code-diagnostics";

import { verifyAnalyticsRuntime } from "./analytics-intent";
import type { AnalyticsRuntimeState } from "../../lib/analytics-archive/readiness-contract";

export type CodeDeployment = {
  id: string;
  url: string;
  projectId: string;
  target: string;
  readyState: string;
  meta?: Record<string, unknown>;
  providerError?: Diagnostic["provider"];
};
export type CodeReleasePhase =
  | "cli-invocation-upload"
  | "deployment-creation"
  | "remote-build"
  | "staged-verification"
  | "promotion-attempt"
  | "domain-assignment"
  | "promotion"
  | "public-verification";
export type CodePhaseEvent = {
  phase: CodeReleasePhase;
  outcome: "started" | "success" | "failure" | "pending";
  durationMs?: number;
};
export interface CodeProviders {
  waitForPoll?(): Promise<void>;
  reportPhase?(event: CodePhaseEvent): void;
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
  health(
    d: CodeDeployment,
    publicDomain: boolean,
  ): Promise<void | AnalyticsRuntimeState>;
}
async function observePhase<T>(
  p: CodeProviders,
  phase: CodeReleasePhase,
  work: () => Promise<T>,
): Promise<T> {
  // Match the existing stage timer; nested phase durations are not additive.
  const startedAt = Date.now();
  p.reportPhase?.({ phase, outcome: "started" });
  try {
    const value = await work();
    p.reportPhase?.({
      phase,
      outcome: "success",
      durationMs: Date.now() - startedAt,
    });
    return value;
  } catch (error) {
    p.reportPhase?.({
      phase,
      outcome: "failure",
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}
export type CodeReleaseResult = {
  deploymentId: string;
  deployment_succeeded: true;
  analytics?: {
    intendedEnabled: boolean;
    stagedObserved: boolean;
    publicObserved: boolean | null;
  };
} & (
  | { public_verified: true; publicVerification: "public verification passed" }
  | {
      public_verified: false;
      publicVerification: "public verification pending";
      reason: Diagnostic;
    }
);
function verifiedResult(deploymentId: string): CodeReleaseResult {
  return {
    deploymentId,
    deployment_succeeded: true,
    public_verified: true,
    publicVerification: "public verification passed",
  };
}
export function nativeReleaseMessage(result: CodeReleaseResult) {
  const observed = result.analytics;
  const state = observed
    ? `analytics intended ${observed.intendedEnabled ? "on" : "off"}; staged observed ${observed.stagedObserved ? "on" : "off"}; public ${observed.publicObserved === null ? "unverified" : `observed ${observed.publicObserved ? "on" : "off"}`}`
    : "analytics state unverified";
  return result.public_verified
    ? `Verified native source deploy: ${result.deploymentId}; ${state}`
    : `Native source deployment succeeded: ${result.deploymentId}; public verification pending; public_verified=false; ${state}`;
}

export async function executeCodeRelease(
  m: CodeManifest | NativeCodeEvidence,
  manifestDigest: string,
  buildDigest: string,
  p: CodeProviders,
) {
  await p.guard([m.vercel.productionDeploymentId]);
  if (m.kind === "code-only" && m.operation === "rollback") {
    if (!m.rollback) throw new Error("code.rollback-binding");
    const d = await p.deployment(m.rollback.deploymentId);
    if (
      d.id !== m.rollback.deploymentId ||
      d.projectId !== m.vercel.projectId ||
      d.target !== "production" ||
      d.readyState !== "READY" ||
      (d.meta?.gitCommitSha ??
        d.meta?.githubCommitSha ??
        d.meta?.releaseSha) !== m.rollback.applicationSha
    )
      throw new Error("code.rollback-identity");
    p.reportDeployment?.(d);
    await observePhase(p, "staged-verification", () =>
      codeGuard("health.staged", () => p.health(d, false)),
    );
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
    await observePhase(p, "public-verification", () =>
      codeGuard("health.public", () => p.health(d, true)),
    );
    return verifiedResult(d.id);
  }
  let target = await observePhase(p, "deployment-creation", async () => {
    let target = await codeGuard("vercel.lookup", () => p.lookup());
    if (!target) {
      try {
        // The CLI is opaque: this duration does not distinguish upload from its
        // deployment request. Creation is observed only once an API candidate exists.
        target = await observePhase(p, "cli-invocation-upload", () =>
          codeGuard("vercel.stage", () => p.stage()),
        );
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
    return target;
  });
  if (m.kind === "native-source") {
    target = await observePhase(p, "remote-build", async () => {
      // --no-wait returns accepted/queued deployments. Poll only the identified write;
      // no second deploy or rebuilt replacement is permitted while it becomes ready.
      const id = target.id;
      for (let poll = 0; ; poll++) {
        await codeGuard("vercel.identity", () =>
          verifyNativeDeploymentIdentity(target!, m, manifestDigest),
        );
        if (poll === 0) p.reportDeployment?.(target);
        if (target.readyState === "READY") break;
        if (["ERROR", "CANCELED"].includes(target.readyState))
          throw new CodeDiagnosticError({
            guard: "vercel.deployment",
            category: "invariant",
            invariant: "code.deployment-build-failed",
            provider: target.providerError,
          });
        if (!["QUEUED", "INITIALIZING", "BUILDING"].includes(target.readyState))
          throw new Error("code.deployment-readiness-invalid");
        if (poll >= 120) throw new Error("code.deployment-readiness-timeout");
        await (p.waitForPoll?.() ??
          new Promise<void>((resolve) => setTimeout(resolve, 5000)));
        const next = await codeGuard("vercel.deployment", () =>
          p.deployment(id),
        );
        if (next.id !== id) throw new Error("code.native-deployment-identity");
        target = next;
      }
      return target;
    });
  } else {
    await codeGuard("vercel.identity", () =>
      verifyReleaseDeploymentIdentity(target, m, manifestDigest, buildDigest),
    );
  }
  if (m.kind !== "native-source") p.reportDeployment?.(target);
  // --skip-domain is a required staging property, verified independently of
  // CLI success. An unexpected assignment must stop before promotion.
  await p.guard([m.vercel.productionDeploymentId]);
  let analytics: CodeReleaseResult["analytics"];
  async function healthWithAnalytics(publicDomain: boolean) {
    const observed = await p.health(target, publicDomain);
    if (m.kind === "native-source") {
      const state = verifyAnalyticsRuntime(observed, {
        commit: m.commit,
        collectionEnabled: m.collectionEnabled,
        targetSha256: m.analyticsReadiness?.targetSha256,
      });
      if (!publicDomain)
        analytics = {
          intendedEnabled: m.collectionEnabled,
          stagedObserved: state.collectionEnabled,
          publicObserved: null,
        };
      else if (analytics) analytics.publicObserved = state.collectionEnabled;
    }
  }
  await observePhase(p, "staged-verification", () =>
    codeGuard("health.staged", () => healthWithAnalytics(false)),
  );
  let promotionConfirmed = false;
  const current = await p.guard([m.vercel.productionDeploymentId]);
  if (current !== target.id) {
    await observePhase(p, "promotion", async () => {
      let failure: Diagnostic | undefined;
      try {
        await observePhase(p, "promotion-attempt", () =>
          codeGuard("vercel.promote", () => p.promote(target.id)),
        );
      } catch (error) {
        failure = classifyCodeFailure("vercel.promote", error);
      }
      await observePhase(p, "domain-assignment", async () => {
        const assigned = await p.guard([
          m.vercel.productionDeploymentId,
          target.id,
        ]);
        if (assigned !== target.id)
          throw outcomeError(
            "vercel.promote",
            failure
              ? "code.promote-outcome-unresolved"
              : "code.promote-not-assigned",
            failure,
          );
        return assigned;
      });
      if (failure)
        p.reportReconciliation?.({
          outcome: "found",
          originalFailure: failure,
        });
    });
    promotionConfirmed = true;
  }
  const startedAt = Date.now();
  p.reportPhase?.({ phase: "public-verification", outcome: "started" });
  try {
    try {
      await codeGuard("health.public", () => healthWithAnalytics(true));
    } catch (error) {
      const reason = classifyCodeFailure("health.public", error);
      if (
        m.kind !== "native-source" ||
        m.operation !== "deploy" ||
        !promotionConfirmed ||
        !confirmedCloudflareChallenge(reason)
      )
        throw error;
      // guard rechecks protected main, approval, current production target and BOTH
      // aliases. Fresh deployment metadata independently rebinds the exact revision.
      const current = await p.guard([target.id]);
      if (current !== target.id) throw new Error("code.production-drift");
      const fresh = await codeGuard("vercel.deployment", () =>
        p.deployment(target.id),
      );
      await codeGuard("vercel.identity", () => {
        verifyNativeDeploymentIdentity(fresh, m, manifestDigest);
        if (fresh.id !== target.id || fresh.readyState !== "READY")
          throw new Error("code.native-deployment-identity");
      });
      p.reportPhase?.({
        phase: "public-verification",
        outcome: "pending",
        durationMs: Date.now() - startedAt,
      });
      return {
        deploymentId: target.id,
        deployment_succeeded: true,
        public_verified: false,
        publicVerification: "public verification pending",
        reason,
        ...(analytics ? { analytics } : {}),
      } satisfies CodeReleaseResult;
    }
    p.reportPhase?.({
      phase: "public-verification",
      outcome: "success",
      durationMs: Date.now() - startedAt,
    });
    return {
      ...verifiedResult(target.id),
      ...(analytics ? { analytics } : {}),
    };
  } catch (error) {
    p.reportPhase?.({
      phase: "public-verification",
      outcome: "failure",
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export function verifyNativeDeploymentIdentity(
  d: CodeDeployment,
  m: NativeCodeEvidence,
  evidenceDigest: string,
) {
  if (
    !/^dpl_[A-Za-z0-9]+$/.test(d.id) ||
    !/^[a-z0-9-]+\.vercel\.app$/.test(d.url) ||
    d.projectId !== m.vercel.projectId ||
    d.target !== "production" ||
    d.meta?.releaseSha !== m.commit ||
    d.meta?.githubCommitSha !== m.commit ||
    d.meta?.releaseEvidence !== evidenceDigest ||
    d.meta?.releaseSourceSha256 !== m.source.sha256 ||
    d.meta?.releaseRunId !== m.workflow.runId ||
    d.meta?.releaseRunAttempt !== m.workflow.runAttempt ||
    d.meta?.analyticsCollectionEnabled !== String(m.collectionEnabled)
  )
    throw new Error("code.native-deployment-identity");
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
