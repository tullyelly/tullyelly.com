import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import manifest from "../lib/images/optimus-images-manifest.json" with { type: "json" };

const castImages = manifest.images.filter((image) =>
  image.src.startsWith("/images/optimus/avenue-q/cast/"),
);

function requestedImagePath(requestUrl: string) {
  const url = new URL(requestUrl);
  return url.pathname === "/_next/image"
    ? url.searchParams.get("url")
    : url.pathname;
}

async function expectContained(page: Page, element: Locator) {
  const bounds = await element.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!bounds || !viewport) throw new Error("Missing image or viewport bounds");
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.y).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function zoomScale(viewer: Locator) {
  return viewer
    .locator(".yarl__slide_current .yarl__slide_wrapper")
    .evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
    );
}

async function touchGesture(
  page: Page,
  frames: Array<Array<{ x: number; y: number }>>,
) {
  // CDP generates real browser touch/pointer input, including simultaneous pinch contacts.
  const session = await page.context().newCDPSession(page);
  try {
    for (let frame = 0; frame < frames.length; frame += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: frame === 0 ? "touchStart" : "touchMove",
        touchPoints: frames[frame].map((point, id) => ({ ...point, id })),
      });
      await page.waitForTimeout(25);
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

test("Markdown image opens by pointer and keyboard, preserves its ratio, and restores focus", async ({
  page,
  isMobile,
}) => {
  await page.goto("/shaolin/avenue-q");
  const trigger = page.getByRole("button", {
    name: "Open image: mom and sarah",
    exact: true,
  });
  const inlineImage = trigger.getByRole("img", {
    name: "mom and sarah",
    exact: true,
  });
  const metadata = manifest.images.find(
    (image) => image.src === "/images/optimus/avenue-q/selfie.webp",
  );
  if (!metadata) throw new Error("Missing selfie metadata");
  await expect(inlineImage).toHaveAttribute("width", String(metadata.width));
  await expect(inlineImage).toHaveAttribute("height", String(metadata.height));
  await trigger.scrollIntoViewIfNeeded();
  const inlineBounds = await inlineImage.boundingBox();
  if (!inlineBounds) throw new Error("Missing inline image bounds");
  expect(inlineBounds.width / inlineBounds.height).toBeCloseTo(
    metadata.width / metadata.height,
    1,
  );

  if (isMobile) await trigger.tap();
  else await trigger.click();
  const viewer = page.getByRole("dialog", {
    name: "Image viewer",
    exact: true,
  });
  await expect(viewer).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  const expandedImage = viewer.getByRole("img", {
    name: "mom and sarah",
    exact: true,
  });
  await expect(expandedImage).toBeVisible();
  await expectContained(page, expandedImage);
  await expect(viewer.getByTestId("image-lightbox-counter")).toHaveCount(0);
  await expect(
    viewer.getByRole("button", { name: "Next", exact: true }),
  ).toHaveCount(0);
  await viewer
    .getByRole("button", { name: "Close image viewer", exact: true })
    .click();
  await expect(viewer).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.press("Enter");
  await expect(viewer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.press("Space");
  await expect(viewer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
});

test("folder gallery shares the viewer, navigates, traps focus, and locks page scrolling", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/shaolin/avenue-q");
  const trigger = page.getByTestId("folder-carousel-thumbnail").first();
  await trigger.scrollIntoViewIfNeeded();
  await expect(page.locator(".yarl__slide img")).toHaveCount(0);
  // A closed gallery may load its optimized preview, but no other slide.
  expect(
    requests
      .map(requestedImagePath)
      .filter((path) =>
        castImages.slice(1).some((image) => path === image.src),
      ),
  ).toEqual([]);
  await trigger.click();
  const viewer = page.getByRole("dialog", {
    name: "Image viewer",
    exact: true,
  });
  await expect(viewer).toBeVisible();
  const initiallyLoadedSlides = viewer.locator(".yarl__slide img");
  await expect(initiallyLoadedSlides).toHaveCount(2);
  await expect
    .poll(() =>
      initiallyLoadedSlides.evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).complete),
      ),
    )
    .toBe(true);
  // The viewer preloads only the adjacent slide rather than the whole folder.
  expect(
    requests
      .map(requestedImagePath)
      .filter((path) =>
        castImages.slice(2).some((image) => path === image.src),
      ),
  ).toEqual([]);
  const counter = viewer.getByTestId("image-lightbox-counter");
  await expect(counter).toHaveText(`1 / ${castImages.length}`);
  await expect(
    viewer.getByRole("button", { name: "Previous", exact: true }),
  ).toBeDisabled();
  await viewer.getByRole("button", { name: "Next", exact: true }).click();
  await expect(counter).toHaveText(`2 / ${castImages.length}`);
  await viewer.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(counter).toHaveText(`1 / ${castImages.length}`);
  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText(`2 / ${castImages.length}`);
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText(`1 / ${castImages.length}`);

  const currentImage = viewer.locator(".yarl__slide_current img");
  await expect(currentImage).toBeVisible();
  await expectContained(page, currentImage);
  const scrollPosition = await page.evaluate(() => window.scrollY);
  await page.mouse.move(5, 5);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(scrollPosition);
  const close = viewer.getByRole("button", {
    name: "Close image viewer",
    exact: true,
  });
  await close.focus();
  const controls = await viewer.getByRole("button").count();
  for (let step = 0; step < controls + 2; step += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        viewer.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
  }
  // Programmatic focus outside must be redirected into the modal as well.
  await trigger.evaluate((element) => element.focus());
  await expect
    .poll(() =>
      viewer.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Open image carousel", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("desktop supports wheel zoom, panning, and fullscreen", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop mouse and fullscreen interaction");
  await page.goto("/shaolin/avenue-q");
  await page.getByTestId("folder-carousel-thumbnail").first().click();
  const viewer = page.getByRole("dialog", {
    name: "Image viewer",
    exact: true,
  });
  const image = viewer.locator(".yarl__slide_current img");
  await expect(image).toBeVisible();
  await image.hover();
  await page.mouse.wheel(0, -200);
  await expect.poll(() => zoomScale(viewer)).toBeGreaterThan(1);
  const wrapper = viewer.locator(".yarl__slide_current .yarl__slide_wrapper");
  const transform = await wrapper.getAttribute("style");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.down();
  await page.mouse.move(viewport.width / 2 + 70, viewport.height / 2 + 40, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(wrapper).not.toHaveAttribute("style", transform ?? "");
  const fullscreen = viewer.getByRole("button", {
    name: "Enter Fullscreen",
    exact: true,
  });
  await expect(fullscreen).toBeVisible();
  await fullscreen.click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement !== null))
    .toBe(true);
  await viewer
    .getByRole("button", { name: "Exit Fullscreen", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true);
  await viewer
    .getByRole("button", { name: "Close image viewer", exact: true })
    .click();
  await expect(viewer).toHaveCount(0);
});

test("mobile supports swipe, double-tap, and pinch zoom with comfortable controls", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch interaction requires the mobile project");
  await page.goto("/shaolin/avenue-q");
  await page.getByTestId("folder-carousel-thumbnail").first().tap();
  const viewer = page.getByRole("dialog", {
    name: "Image viewer",
    exact: true,
  });
  const counter = viewer.getByTestId("image-lightbox-counter");
  await expect(counter).toHaveText(`1 / ${castImages.length}`);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  const center = { x: viewport.width / 2, y: viewport.height / 2 };
  const scrollPosition = await page.evaluate(() => window.scrollY);
  await touchGesture(
    page,
    Array.from({ length: 9 }, (_, step) => [
      { x: viewport.width * 0.85 - step * viewport.width * 0.08, y: center.y },
    ]),
  );
  await expect(counter).toHaveText(`2 / ${castImages.length}`);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(scrollPosition);
  const image = viewer.locator(".yarl__slide_current img");
  await expect(image).toBeVisible();
  await expectContained(page, image);
  await page.touchscreen.tap(center.x, center.y);
  await page.touchscreen.tap(center.x, center.y);
  await expect.poll(() => zoomScale(viewer)).toBeGreaterThan(1);
  await viewer.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect.poll(() => zoomScale(viewer)).toBe(1);
  await touchGesture(
    page,
    Array.from({ length: 9 }, (_, step) => [
      { x: center.x - 30 - step * 10, y: center.y },
      { x: center.x + 30 + step * 10, y: center.y },
    ]),
  );
  await expect.poll(() => zoomScale(viewer)).toBeGreaterThan(1);
  await expect(counter).toHaveText(`2 / ${castImages.length}`);
  const controls = viewer.getByRole("button");
  for (const control of await controls.all()) {
    if (!(await control.isVisible())) continue;
    const bounds = await control.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  await viewer
    .getByRole("button", { name: "Close image viewer", exact: true })
    .tap();
  await expect(viewer).toHaveCount(0);
  await expect(
    page.getByTestId("folder-carousel-thumbnail").first(),
  ).toBeFocused();
});
