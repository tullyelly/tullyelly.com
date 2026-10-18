/** Anonymous, read-only comparison of the two fixed public homepage origins. */
import { pathToFileURL } from "node:url";
import { readHealthResponse } from "./release/code-health";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
} from "./release/code-diagnostics";
import { safeNetworkCauseCodes } from "./release/app";
import type { HealthRequestTrace } from "./release/health-observation.mjs";

const publicOrigins = [
  "https://tullyelly.com",
  "https://www.tullyelly.com",
] as const;
type PublicHealthDiagnostic = {
  initialOrigin: (typeof publicOrigins)[number];
  outcome: "success" | "http-status" | "missing-doctype" | "request-failed";
  status?: number;
  trace?: HealthRequestTrace;
  networkCauseCodes?: string[];
};

/** Keep request policy in the production verifier; only collect its safe trace. */
export async function diagnosePublicHealth(
  fetcher: typeof fetch = fetch,
): Promise<PublicHealthDiagnostic[]> {
  const reports: PublicHealthDiagnostic[] = [];
  for (const initialOrigin of publicOrigins) {
    let trace: HealthRequestTrace | undefined;
    try {
      const response = await readHealthResponse({
        // The shared verifier validates this field even for public-only reads.
        // This fixed placeholder is never requested.
        stagedHost: "public-health-diagnostic.vercel.app",
        publicDomain: true,
        publicOrigin: initialOrigin,
        path: "/",
        timeoutMs: 30000,
        fetcher,
        onObservation: (observation) => {
          trace = observation;
        },
      });
      const outcome =
        response.status !== 200
          ? "http-status"
          : (await response.text()).toLowerCase().includes("<!doctype html>")
            ? "success"
            : "missing-doctype";
      reports.push({ initialOrigin, outcome, status: response.status, trace });
    } catch (error) {
      // Native fetch and body-stream errors can contain addresses and messages.
      // Only the existing bounded network-code classifier crosses this boundary.
      const diagnostic = classifyCodeFailure(
        "health.public",
        new CodeDiagnosticError({
          guard: "health.public",
          category: "transport",
          networkCauseCodes: safeNetworkCauseCodes(error),
        }),
      );
      reports.push({
        initialOrigin,
        outcome: "request-failed",
        ...(trace?.responses.at(-1)?.status === undefined
          ? {}
          : { status: trace.responses.at(-1)?.status }),
        ...(trace ? { trace } : {}),
        ...(diagnostic.networkCauseCodes?.length
          ? { networkCauseCodes: diagnostic.networkCauseCodes }
          : {}),
      });
    }
  }
  return reports;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2) {
    console.log(JSON.stringify({ outcome: "invalid-arguments" }));
    process.exitCode = 1;
  } else {
    diagnosePublicHealth()
      .then((reports) => {
        for (const report of reports) console.log(JSON.stringify(report));
        process.exitCode = reports.every((r) => r.outcome === "success")
          ? 0
          : 1;
      })
      .catch(() => {
        console.log(JSON.stringify({ outcome: "diagnostic-failed" }));
        process.exitCode = 1;
      });
  }
}
