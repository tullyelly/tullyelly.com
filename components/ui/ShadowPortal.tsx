"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type ShadowPortalContext = {
  shadowRoot: ShadowRoot;
  mount: HTMLDivElement;
};

type ShadowPortalProps = {
  children: React.ReactNode;
  styleText: string;
  containerId?: string;
  onReady?: (context: ShadowPortalContext | null) => void;
};

export default function ShadowPortal({
  children,
  styleText,
  containerId = "persona-menu-root",
  onReady,
}: ShadowPortalProps): React.ReactNode {
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null);
  const hostRef = React.useRef<HTMLElement | null>(null);
  const shadowRef = React.useRef<ShadowRoot | null>(null);
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  React.useEffect(() => {
    let host = document.getElementById(containerId) as HTMLElement | null;
    if (!host) {
      host = document.createElement("div");
      host.id = containerId;
      document.body.appendChild(host);
    }
    hostRef.current = host;

    if (!shadowRef.current) {
      shadowRef.current =
        host.shadowRoot ?? host.attachShadow({ mode: "open" });
    }

    const localShadow = shadowRef.current;

    const styleEl = document.createElement("style");
    styleEl.textContent = styleText;
    localShadow.appendChild(styleEl);
    styleRef.current = styleEl;

    const mountEl = document.createElement("div");
    localShadow.appendChild(mountEl);
    setSlot(mountEl);
    onReady?.({ shadowRoot: localShadow, mount: mountEl });

    return () => {
      onReady?.(null);
      if (styleRef.current && localShadow.contains(styleRef.current)) {
        localShadow.removeChild(styleRef.current);
      }
      styleRef.current = null;
      if (mountEl && localShadow.contains(mountEl)) {
        localShadow.removeChild(mountEl);
      }
      setSlot(null);
    };
  }, [containerId, onReady, styleText]);

  if (slot) {
    return createPortal(children, slot);
  }

  return null;
}

export const PERSONA_MENU_CSS = `
:host {
  all: initial;
}

*, *::before, *::after {
  box-sizing: border-box;
}

[data-persona-menu][hidden] {
  display: none !important;
}

[data-nav-dropdown] {
  position: fixed;
  z-index: 2000;
  background: var(--pm-surface, #ffffff);
  color: var(--pm-ink, #0b1220);
  border: 6px solid var(--pm-frame, #00471b);
  border-radius: 0 0 16px 16px;
  margin-top: -1px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.1);
  width: clamp(12rem, calc(8ch + 4rem), 18rem);
  max-width: 90vw;
  min-height: 56px;
  max-height: min(70vh, 560px);
  box-sizing: border-box;
  overflow: auto;
  padding: 0.625rem;
  display: grid;
  place-items: center;
}

[data-nav-dropdown]:focus {
  outline: none;
}

[data-nav-dropdown-wrapper] {
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.header {
  font: 600 12px/1.2 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  letter-spacing: 0.04em;
  opacity: 0.8;
  padding: 4px 8px 8px;
  text-transform: uppercase;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  width: 100%;
}

[data-nav-dropdown] a,
[data-nav-dropdown] [role="menuitem"] {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100% !important;
  height: 2.25rem !important;
  padding: 0 0.75rem !important;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

[data-nav-dropdown] a *,
[data-nav-dropdown] [role="menuitem"] * {
  cursor: inherit;
}

.item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  margin: 0;
  border-radius: 6px;
  border: 1px solid
    var(--pm-item-border, var(--pm-outline, #d8dfea));
  background: var(--pm-item-bg, rgba(226, 232, 240, 0.6));
  cursor: pointer;
  outline: none;
  color: inherit;
  text-decoration: none;
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  transition: background-color 150ms ease-out, border-color 150ms ease-out,
    box-shadow 150ms ease-out,
    transform 150ms ease-out;
  transform-origin: center;
  will-change: transform;
  box-shadow: 0 0 0 0 transparent, 0 0 0 0 transparent;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  width: 100%;
  text-align: left;
}

.item:hover,
.item[data-highlighted] {
  background: var(--pm-item-hover, var(--pm-surface-hover, #f3f6fb));
  border-color: var(
    --pm-item-border-active,
    var(--pm-outline, #d8dfea)
  );
}

.item:focus-visible {
  background: var(--pm-item-hover, var(--pm-surface-hover, #f3f6fb));
  border-color: var(
    --pm-item-border-active,
    var(--pm-outline, #d8dfea)
  );
  box-shadow: 0 0 0 2px var(--pm-surface, #ffffff),
    0 0 0 4px var(--pm-ring, rgba(59, 130, 246, 0.45));
}

.item:active,
.item[data-pressed="true"] {
  background: var(
    --pm-surface-active,
    var(--pm-surface-hover, #f3f6fb)
  );
  border-color: var(
    --pm-item-border-active,
    var(--pm-outline, #d8dfea)
  );
  box-shadow: 0 0 0 2px var(--pm-surface, #ffffff),
    0 0 0 4px var(--pm-ring, rgba(59, 130, 246, 0.35));
  transform: translateY(0.5px) scale(0.99);
}

.item[data-active="true"] {
  background: var(--pm-item-hover, var(--pm-surface-hover, #f3f6fb));
  border-color: var(
    --pm-item-border-active,
    var(--pm-outline, #d8dfea)
  );
  box-shadow: 0 0 0 2px var(--pm-surface, #ffffff),
    0 0 0 4px var(--pm-ring, rgba(59, 130, 246, 0.35));
}

.item > * {
  cursor: inherit;
}

.icon {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.icon .pm-icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.75;
}

.label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font: 500 14px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  user-select: none;
}

@media (min-width: 768px) {
  [data-nav-dropdown] {
    padding: 0.75rem;
  }

  [data-nav-dropdown] a,
  [data-nav-dropdown] [role="menuitem"] {
    padding: 0 0.875rem !important;
  }
}

.meta {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font: 600 11px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background: var(--pm-badge-bg, #0b1220);
  color: var(--pm-badge-fg, #ffffff);
  user-select: none;
}

.hotkey {
  border: 1px solid var(--pm-outline, #d8dfea);
  border-radius: 8px;
  padding: 2px 6px;
  font: 500 11px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  opacity: 0.75;
  user-select: none;
}

.sep {
  height: 1px;
  margin: 6px 4px;
  background: var(--pm-outline, #d8dfea);
  border: 0;
}

.list button,
.list a {
  all: unset;
  cursor: pointer;
  user-select: none;
}

.list a {
  display: block;
}

.list button *,
.list a * {
  cursor: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

@media (prefers-reduced-motion: reduce) {
  .item {
    transition: background-color 100ms ease-out !important;
    transform: none !important;
  }

  .item:active,
  .item[data-pressed="true"] {
    transform: none !important;
  }
}
`;
