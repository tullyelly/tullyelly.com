import { expect, test } from "@playwright/test";
import {
  ensureReady,
  navigateToSlug,
  expectBreadcrumbs,
  clickNavLink,
} from "./utils/ui";

const ROUTES = [
  { path: "/", expectation: /home/i },
  { path: "/mark2", expectation: /home\s*\/\s*mark2/i },
  { path: "/mark2/blueprint", expectation: /home\s*\/\s*mark2/i },
  {
    path: "/tullyelly/ruins",
    expectation: /home\s*\/\s*tullyelly\s*\/\s*ruins/i,
  },
];

for (const route of ROUTES) {
  test(`renders breadcrumbs on first paint for ${route.path}`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await ensureReady(page);
    await expectBreadcrumbs(page, route.expectation);
  });
}

test("breadcrumbs update immediately during client navigation", async ({
  page,
}) => {
  await page.goto("/");
  await ensureReady(page);

  // Navigate to /mark2 via E2E nav helper.
  await navigateToSlug(page, "mark2");
  await expectBreadcrumbs(page, /home\s*\/\s*mark2/i);

  // Navigate to /mark2/blueprint using dedicated nav link.
  await page.getByTestId("e2e-nav-mark2-blueprint").click();
  await page.waitForURL("/mark2/blueprint");
  await expectBreadcrumbs(page, /home\s*\/\s*mark2/i);

  // Navigate to /tullyelly/ruins using E2E nav shortcuts.
  await navigateToSlug(page, "tullyelly", { allowBypass: true });
  await expectBreadcrumbs(page, /home\s*\/\s*tullyelly/i);
  await clickNavLink(page, "tullyelly-ruins", { allowBypass: true });
  await expectBreadcrumbs(page, /home\s*\/\s*tullyelly\s*\/\s*ruins/i);
});
