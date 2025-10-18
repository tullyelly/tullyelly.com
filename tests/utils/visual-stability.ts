import type { Page } from "@playwright/test";

const STABILITY_STYLES = `
*, *::before, *::after {
  animation-delay: 0s !important;
  animation-duration: 0s !important;
  animation-iteration-count: 1 !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
  transition-property: none !important;
}
input, textarea, [contenteditable="true"] {
  caret-color: transparent !important;
}
#nprogress,
#nprogress *,
[data-progress],
[data-progress] * {
  display: none !important;
}
`;

export async function ensureVisualStability(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { fonts } = document;
    if (fonts && "ready" in fonts) {
      try {
        await fonts.ready;
      } catch {
        // ignore font loading failures
      }
    }
  });

  const existingHandle = await page.$(`style[data-visual-stability]`);
  if (!existingHandle) {
    const styleHandle = await page.addStyleTag({ content: STABILITY_STYLES });
    await styleHandle.evaluate((style: HTMLElement) => {
      style.setAttribute("data-visual-stability", "true");
    });
    await styleHandle.dispose();
    return;
  }

  await existingHandle.evaluate((style: HTMLElement, css: string) => {
    if (style.textContent !== css) {
      style.textContent = css;
    }
  }, STABILITY_STYLES);
  await existingHandle.dispose();
}
