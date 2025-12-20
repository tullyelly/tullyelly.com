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
  const layerRef = React.useRef<HTMLDivElement | null>(null);

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

    const layerEl = document.createElement("div");
    layerEl.className = "menu-portal-layer";
    layerEl.setAttribute("data-testid", "menu-portal-root");
    localShadow.appendChild(layerEl);
    layerRef.current = layerEl;

    const mountEl = document.createElement("div");
    mountEl.className = "menu-portal-surface";
    layerEl.appendChild(mountEl);
    setSlot(mountEl);
    onReady?.({ shadowRoot: localShadow, mount: mountEl });

    return () => {
      onReady?.(null);
      if (styleRef.current && localShadow.contains(styleRef.current)) {
        localShadow.removeChild(styleRef.current);
      }
      styleRef.current = null;
      if (layerRef.current && layerRef.current.contains(mountEl)) {
        layerRef.current.removeChild(mountEl);
      }
      if (mountEl && localShadow.contains(mountEl)) {
        localShadow.removeChild(mountEl);
      }
      if (layerRef.current && localShadow.contains(layerRef.current)) {
        localShadow.removeChild(layerRef.current);
      }
      layerRef.current = null;
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
  --pm-cream: #eee1c6;
  --pm-frame: var(--pm-cream);
  --pm-outline: var(--pm-cream);
  --pm-surface: #ffffff;
  --pm-surface-hover: var(--pm-cream);
  --pm-item-bg: #ffffff;
  --pm-item-hover: var(--pm-cream);
  --pm-ring: color-mix(in srgb, #00471b 70%, transparent);
  --pm-pad: 0px;
}

.menu-portal-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483646;
}

.menu-portal-surface {
  position: relative;
  pointer-events: none;
  min-width: 0;
}

.menu-portal-surface > * {
  pointer-events: auto;
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
  border: 2px solid var(--pm-frame, #eee1c6);
  border-radius: 20px;
  margin-top: -1px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.12);
  width: auto;
  min-width: 16rem;
  max-width: min(22rem, 92vw);
  min-height: 56px;
  max-height: min(60vh, 520px);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
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
  gap: 0.75rem;
  align-items: stretch;
  width: 100%;
  padding: 0;
}

[data-nav-dropdown] a,
[data-nav-dropdown] [role="menuitem"] {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100% !important;
  padding: 0 !important;
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
  gap: 12px;
  min-height: 44px;
  padding: 12px 0;
  margin: 0;
  width: 100%;
  border-radius: 0;
  border: 0;
  background: var(--pm-item-bg, #ffffff);
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
  font-size: 15px;
  line-height: 1.5;
  width: 100%;
  text-align: left;
}

.item:hover,
.item[data-highlighted] {
  background: var(--pm-item-hover, var(--pm-surface-hover, #eee1c6));
}

.item:focus-visible {
  background: var(--pm-item-hover, var(--pm-surface-hover, #eee1c6));
  box-shadow: none;
}

.item:active,
.item[data-pressed="true"] {
  background: var(
    --pm-surface-active,
    var(--pm-surface-hover, #eee1c6)
  );
  box-shadow: none;
  transform: translateY(0.5px) scale(0.99);
}

.item[data-active="true"] {
  background: var(--pm-item-hover, var(--pm-surface-hover, #eee1c6));
  box-shadow: none;
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
  font: 500 15px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  user-select: none;
}

@media (min-width: 768px) {
  [data-nav-dropdown] {
    padding: 1rem 0;
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
