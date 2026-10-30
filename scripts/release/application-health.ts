/** Shared staged/public acceptance; neither caller can substitute a homepage-only check. */
import type { CodeDeployment } from "./code-release";
import type { PublicationPlan } from "./code-publication-plan";
import { checkCodeHealth, readHealthResponse } from "./code-health";
import {
  checkPublicationHealth,
  checkChangedPublicationHealth,
} from "./code-publication-health";

import { verifyAnalyticsRuntime } from "./analytics-intent";

export async function checkApplicationHealth(options: {
  deployment: CodeDeployment;
  projectId: string;
  publicDomain: boolean;
  commit: string;
  publication: PublicationPlan;
  bypassSecret?: string;
  fetcher?: typeof fetch;
  analytics?: { collectionEnabled: boolean; targetSha256?: string };
}) {
  await checkCodeHealth({ ...options, operation: "deploy" });
  const read = (path: string) =>
    readHealthResponse({
      stagedHost: options.deployment.url,
      publicDomain: options.publicDomain,
      path,
      // Optimized image URLs belong to the canonical rendered-page origin.
      publicOrigin: options.publicDomain
        ? "https://www.tullyelly.com"
        : undefined,
      bypassSecret: options.bypassSecret,
      fetcher: options.fetcher,
      timeoutMs: 30000,
      rejectChallenges: true,
    });
  await checkPublicationHealth(
    read,
    options.commit,
    options.publication.archive,
  );
  await checkChangedPublicationHealth(read, options.publication);
  if (options.analytics) {
    const response = await read("/api/health/analytics");
    if (response.status !== 200)
      throw new Error("code.analytics-runtime-response");
    return verifyAnalyticsRuntime(await response.json(), {
      commit: options.commit,
      ...options.analytics,
    });
  }
}
