import { test as base, expect } from "@playwright/test";

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

export { expect } from "@playwright/test";
