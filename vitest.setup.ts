import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  const win = window as typeof window & {
    matchMedia?: typeof window.matchMedia;
    ResizeObserver?: typeof window.ResizeObserver;
  };

  if (!win.matchMedia) {
    win.matchMedia = () => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!win.ResizeObserver) {
    win.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof window.ResizeObserver;
  }

  if (!win.HTMLElement.prototype.scrollIntoView) {
    win.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

if (typeof PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    constructor(type: string, init?: MouseEventInit) {
      super(type, init);
    }
  }

  // @ts-expect-error PointerEvent is missing from Node globals
  globalThis.PointerEvent = PointerEvent;
}
