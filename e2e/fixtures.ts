import { test as base, expect } from "@playwright/test";
import { waitAppReady } from "../tests/utils/waitAppReady";

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      const type = msg.type();
      if (
        (type === "error" || type === "warning") &&
        msg.text().includes("Hydration failed")
      ) {
        errors.push(msg.text());
      }
    });
    await use(page);
    expect(errors).toHaveLength(0);
  },
});

test.beforeAll(async () => {
  const baseURL =
    process.env.PLAYWRIGHT_TEST_BASE_URL ??
    process.env.BASE_URL ??
    "http://127.0.0.1:4321";
  await waitAppReady(baseURL);
});

export { expect } from "@playwright/test";
