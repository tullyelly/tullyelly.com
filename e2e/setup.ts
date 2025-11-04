import { test } from "./fixtures";

const allowedHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

test.beforeEach(async ({ context }) => {
  const marker = context as unknown as {
    __networkBlockerApplied?: boolean;
  };
  if (marker.__networkBlockerApplied) {
    return;
  }

  await context.route("**/*", (route) => {
    const requestUrl = route.request().url();
    try {
      const url = new URL(requestUrl);
      if (allowedHosts.has(url.hostname)) {
        route.continue();
        return;
      }
    } catch {
      // Non-URL protocols (data:, about:, etc.) should pass through untouched.
      route.continue();
      return;
    }
    route.abort();
  });

  marker.__networkBlockerApplied = true;
});
