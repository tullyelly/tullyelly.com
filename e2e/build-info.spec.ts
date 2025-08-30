import { test, expect } from "@playwright/test";

test("/api/__version returns build info", async ({ request }) => {
  const res = await request.get("/api/__version");
  if (!res.ok()) {
    console.error("status", res.status(), "body:", await res.text());
  }
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.commitSha).toBeTruthy();
});

test("response headers include build metadata", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.headers()["x-commit"]).toBeTruthy();
  expect(res?.headers()["x-ref"]).toBeTruthy();
  expect(res?.headers()["x-built-at"]).toBeTruthy();
  expect(res?.headers()["x-env"]).toBeTruthy();
});
