import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

test.use({ hasTouch: true, contextOptions: { reducedMotion: "reduce" } });

let script: string;
let css: string;

test.beforeAll(async () => {
  const { build } = await import("vite");
  const { default: tailwind } = await import("@tailwindcss/postcss");
  const result = await build({
    configFile: false,
    css: { postcss: { plugins: [tailwind()] } },
    resolve: { alias: { "@": process.cwd() } },
    esbuild: { jsx: "automatic" },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      lib: {
        entry: path.resolve("tests/browser/fixtures/chart-sizing.tsx"),
        name: "ChartSizing",
        formats: ["iife"],
      },
    },
  });
  const bundle = Array.isArray(result) ? result[0] : result;
  if (!("output" in bundle)) throw new Error("Expected a chart fixture bundle");
  script = bundle.output
    .filter((item) => item.type === "chunk")
    .map((item) => item.code)
    .join("\n");
  css = bundle.output
    .flatMap((item) =>
      item.type === "asset" && item.fileName.endsWith(".css")
        ? [String(item.source)]
        : [],
    )
    .join("\n");
  expect(css).not.toBe("");
});

async function mount(page: Page, query = "") {
  const warnings: string[] = [];
  const errors: string[] = [];
  page.on("console", (message) => {
    if (
      /The width\(.*and height\(.*should be greater than 0/.test(message.text())
    )
      warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("http://charts.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }),
  );
  await page.goto(`http://charts.test/${query}`);
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: script });
  return { warnings, errors };
}

const charts = [
  ["tcdb-card-traffic-chart", 320],
  ["persona-activity-chart", 300],
  ["homie-card-count-sparkline", 96],
  ["clan-card-count-sparkline", 96],
  ["homie-tag-usage-chart", 384],
  ["squad-commentary-chart", 360],
] as const;

async function expectSizedCharts(page: Page, rem = 16, compact = false) {
  for (const [id, reservedHeight] of charts) {
    const chart = page.getByTestId(id);
    await expect(
      chart.locator(".recharts-wrapper > svg.recharts-surface"),
    ).toHaveCount(1);
    await expect
      .poll(() =>
        chart.evaluate((node) => {
          const svg = node.querySelector(
            ".recharts-wrapper > svg.recharts-surface",
          )!;
          const wrapper = svg.closest(".recharts-wrapper")!;
          const actual = wrapper.getBoundingClientRect();
          const nestedReservation = [
            "tcdb-card-traffic-chart",
            "persona-activity-chart",
          ].includes(node.getAttribute("data-testid") ?? "");
          const reservation = (
            nestedReservation ? node.firstElementChild! : node
          ).getBoundingClientRect();
          return (
            Number(svg.getAttribute("width")) > 0 &&
            Number(svg.getAttribute("height")) > 0 &&
            Math.abs(Number(svg.getAttribute("width")) - actual.width) <= 1 &&
            Math.abs(Number(svg.getAttribute("height")) - actual.height) <= 1 &&
            Math.abs(actual.width - reservation.width) <= 1 &&
            Math.abs(actual.height - reservation.height) <= 1
          );
        }),
      )
      .toBe(true);
    const expectedHeight = id.includes("sparkline")
      ? 6 * rem
      : id === "homie-tag-usage-chart" && compact
        ? 320
        : id === "tcdb-card-traffic-chart" && page.viewportSize()!.width < 768
          ? 250
          : reservedHeight;
    await expect
      .poll(() =>
        chart
          .locator(".recharts-wrapper > svg.recharts-surface")
          .getAttribute("height")
          .then(Number),
      )
      .toBe(expectedHeight);
    await expect(
      chart
        .locator(".recharts-line-curve, .recharts-bar-rectangle path")
        .first(),
    ).toBeVisible();
  }
}

test("detects the original warning with real Recharts", async ({ page }) => {
  const { warnings, errors } = await mount(page, "?legacy=1");
  await expect
    .poll(() =>
      warnings.some(
        (warning) =>
          warning.includes("width(-1)") && warning.includes("height(-1)"),
      ),
    )
    .toBe(true);
  await expect(
    page.locator(".recharts-wrapper > svg.recharts-surface"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("sizes all six charts on load, remount, narrow layout and resize", async ({
  page,
}) => {
  const { warnings, errors } = await mount(page);
  await expectSizedCharts(page);
  await page.getByRole("button", { name: "Navigate", exact: true }).click();
  await expectSizedCharts(page);
  for (const width of [280, 390, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await expectSizedCharts(page);
    if (width === 280) {
      for (const id of ["squad-commentary-chart"]) {
        const container = page.getByTestId(id);
        const scrollable =
          id === "squad-commentary-chart" ? container.locator("..") : container;
        expect(
          await scrollable.evaluate(
            (node) =>
              node.scrollWidth > node.clientWidth &&
              getComputedStyle(node).overflowX === "auto",
          ),
        ).toBe(true);
        await scrollable.evaluate((node) => {
          node.scrollLeft = 40;
        });
        expect(
          await scrollable.evaluate((node) => node.scrollLeft),
        ).toBeGreaterThan(0);
      }
    }
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "20px";
  });
  await expectSizedCharts(page, 20);
  await page.getByRole("button", { name: "Change tag count" }).click();
  await expectSizedCharts(page, 20, true);
  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);
});

test("measures charts mounted hidden and recovers after repeated visibility changes", async ({
  page,
}) => {
  const { warnings, errors } = await mount(page, "?hidden=1");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Toggle visibility" }).click();
    await expectSizedCharts(page);
    await page.getByRole("button", { name: "Toggle visibility" }).click();
    await expect(page.locator("main")).toBeHidden();
    await page.setViewportSize({ width: i === 0 ? 390 : 900, height: 900 });
  }
  await page.getByRole("button", { name: "Toggle visibility" }).click();
  await expectSizedCharts(page);
  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);
});

test("preserves empty states and renders charts when data returns", async ({
  page,
}) => {
  const { warnings, errors } = await mount(page);
  await expectSizedCharts(page);
  await page.getByRole("button", { name: "Toggle empty" }).click();
  await expect(
    page.locator(".recharts-wrapper > svg.recharts-surface"),
  ).toHaveCount(0);
  await expect(
    page.getByText("No TCDb card traffic in this 10-day window."),
  ).toBeVisible();
  await expect(
    page.getByText("No activity in this 10-week window."),
  ).toBeVisible();
  await expect(
    page.getByText("No homie tags have been used in published Chronicles yet."),
  ).toBeVisible();
  await expect(
    page.getByText("No commentary has been logged yet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle empty" }).click();
  await expectSizedCharts(page);
  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);
});

test("retains chart labels and interactive tooltip content", async ({
  page,
}) => {
  const { warnings, errors } = await mount(page);
  await expectSizedCharts(page);
  await expect(
    page
      .getByTestId("tcdb-card-traffic-chart")
      .getByText("Sent", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("tcdb-card-traffic-chart")
      .getByText("Received", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("persona-activity-chart")
      .getByText("Week 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("homie-tag-usage-chart")
      .getByText("homie1", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("squad-commentary-chart")
      .getByText("Homie 1", { exact: true }),
  ).toBeVisible();

  const tooltips = [
    ["persona-activity-chart", /Posts: .* posts/],
    ["homie-card-count-sparkline", /cards; rank/],
    ["clan-card-count-sparkline", /cards; rank/],
    ["homie-tag-usage-chart", /mentions? across .*chronicles?/],
    ["squad-commentary-chart", /comments?/],
  ] as const;
  for (const [id, content] of tooltips) {
    const chart = page.getByTestId(id);
    const canvas = chart.locator(".recharts-wrapper > svg.recharts-surface");
    await canvas.focus();
    await page.keyboard.press("ArrowRight");
    await expect(chart.locator(".recharts-tooltip-wrapper")).toBeVisible();
    await expect(chart.locator(".recharts-tooltip-wrapper")).toContainText(
      content,
    );
  }
  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath("chart-sizing.png"),
    fullPage: true,
  });
});

for (const width of [320, 375, 390, 430, 768, 1280]) {
  test(`traffic fits and remains accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const { errors } = await mount(page, "?traffic=1");
    const chart = page.getByTestId("tcdb-card-traffic-chart");
    await expect
      .poll(() =>
        chart.locator(".recharts-xAxis .recharts-cartesian-axis-tick").count(),
      )
      .toBeGreaterThanOrEqual(3);
    if (width < 768)
      expect(
        await chart
          .locator(".recharts-xAxis .recharts-cartesian-axis-tick")
          .count(),
      ).toBeLessThanOrEqual(5);
    const checkBounds = async () => {
      await expect
        .poll(() =>
          chart.evaluate((node) => node.scrollWidth <= node.clientWidth),
        )
        .toBe(true);
      const labels = await chart
        .locator(".recharts-xAxis .recharts-cartesian-axis-tick text")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return { left: r.left, right: r.right };
          }),
        );
      for (let i = 1; i < labels.length; i++)
        expect(labels[i].left).toBeGreaterThan(labels[i - 1].right);
      for (const label of labels) {
        expect(label.left).toBeGreaterThanOrEqual(0);
        expect(label.right).toBeLessThanOrEqual(width);
      }
      const bounds = await chart.boundingBox();
      const axisBounds = await chart
        .locator(".recharts-yAxis text")
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getBoundingClientRect().left),
        );
      for (const left of axisBounds)
        expect(left).toBeGreaterThanOrEqual(bounds!.x);
    };
    await checkBounds();
    const select = chart.getByRole("combobox");
    await select.selectOption("2027-01-01");
    await expect(chart.locator("[aria-live]")).toContainText("January 1, 2027");
    await expect(chart.locator("[aria-live]")).toContainText(
      "Sent: 123456 cards across 2 trades",
    );
    await expect(chart.locator("[aria-live]")).toContainText(
      "Received: 98765 cards across 3 trades",
    );
    await select.selectOption("2026-12-27");
    const surface = chart.locator(".recharts-wrapper > svg.recharts-surface");
    const plot = await surface.boundingBox();
    // Select via the wide day column, away from either tiny series marker.
    const sentPoint = chart
      .locator(".recharts-line-dots")
      .first()
      .locator("circle")
      .nth(5);
    const point = await sentPoint.boundingBox();
    await page.touchscreen.tap(
      point!.x + point!.width / 2,
      plot!.y + plot!.height / 2,
    );
    await expect(select).toHaveValue("2027-01-01");
    await select.focus();
    await page.keyboard.press("ArrowDown");
    await expect(select).toHaveValue("2027-01-02");
    await expect(chart.locator("[aria-live]")).toContainText(
      "0 cards across 0 trades",
    );
    await chart.locator("summary").click();
    await expect(chart.getByRole("listitem")).toHaveCount(10);
    await chart
      .locator("..")
      .screenshot({ path: test.info().outputPath(`traffic-${width}.png`) });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await checkBounds();
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(
      chart.locator(".recharts-xAxis .recharts-cartesian-axis-tick"),
    ).toHaveCount(3);
    expect(errors).toEqual([]);
  });
}
