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

.menu {
  position: fixed;
  z-index: 2000;
  background: var(--pm-surface, #ffffff);
  color: var(--pm-ink, #0b1220);
  border: 6px solid var(--pm-frame, #00471b);
  border-radius: 0 0 16px 16px;
  margin-top: -1px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  min-width: 22rem;
  max-width: 92vw;
  max-height: min(70vh, 560px);
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.menu:focus {
  outline: none;
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
  gap: 4px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  color: inherit;
  text-decoration: none;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  transition: background-color 150ms ease-out, box-shadow 150ms ease-out,
    transform 150ms ease-out;
  transform-origin: center;
  will-change: transform;
}

.item:hover,
.item[data-highlighted],
.item:focus-visible {
  background: var(--pm-surface-hover, #f3f6fb);
  box-shadow: inset 0 0 0 1px var(--pm-outline, #d8dfea);
}

.item:active,
.item[data-pressed="true"] {
  background: var(
    --pm-surface-active,
    var(--pm-surface-hover, #f3f6fb)
  );
  box-shadow: inset 0 0 0 1px var(--pm-outline, #d8dfea);
  transform: translateY(0.5px) scale(0.99);
}

.item[data-active="true"] {
  background: var(--pm-surface-hover, #f3f6fb);
  box-shadow: inset 0 0 0 1px var(--pm-outline, #d8dfea);
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
  font: 500 14px/1.25 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  user-select: none;
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
}

.list a {
  display: block;
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
