import type { Page } from "@playwright/test";

const HEALTH_TIMEOUT_MS = 30_000;
const HYDRATION_TIMEOUT_MS = 8_000;
const HYDRATION_SETTLE_DELAY_MS = 300;

export async function waitAppReady(target: string | Page): Promise<void> {
  if (typeof target === "string") {
    await waitForHealth(target);
    return;
  }

  await waitForHydration(target);
}

async function waitForHealth(baseURL: string): Promise<void> {
  const url = new URL("/api/health", baseURL).toString();
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // ignore errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error("App did not become ready in time");
}

async function waitForHydration(page: Page): Promise<void> {
  const deadline = Date.now() + HYDRATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    // Prefer explicit app-ready signals when available.
    const readySignal = await page.$('[data-app-ready="true"]');
    if (readySignal) {
      await readySignal.dispose();
      await page.waitForTimeout(HYDRATION_SETTLE_DELAY_MS);
      return;
    }

    // Fallback: wait for key navigation affordances to hydrate.
    const [navHandle, footerHandle] = await Promise.all([
      page.$('[data-testid="nav-mobile-drawer"]'),
      page.$("footer"),
    ]);

    const navReady = Boolean(navHandle);
    const footerReady = Boolean(footerHandle);

    if (navHandle) await navHandle.dispose();
    if (footerHandle) await footerHandle.dispose();

    if (navReady && footerReady) {
      await page.waitForTimeout(HYDRATION_SETTLE_DELAY_MS);
      return;
    }

    await page.waitForTimeout(150);
  }

  throw new Error("App did not hydrate within the expected window.");
}
