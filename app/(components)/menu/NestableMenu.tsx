"use client";

import * as React from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Lucide from "lucide-react";
import type { PersonaItem } from "@/types/nav";
import ShadowPortal, {
  PERSONA_MENU_CSS,
  type ShadowPortalContext,
} from "@/components/ui/ShadowPortal";
import { useMenuAim } from "@/app/(components)/menu/useMenuAim";
import {
  AnyLink,
  Icon,
  isActiveHref,
  readHotkey,
} from "@/components/nav/menuUtils";

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

const POPPER_WRAPPER_SELECTOR = "[data-radix-popper-content-wrapper]";

type NestableMenuProps = {
  persona: PersonaItem;
  pathname: string;
  isOpen: boolean;
  onOpenChange: (id: string, open: boolean) => void;
  registerTrigger: (id: string, node: HTMLButtonElement | null) => void;
  focusTrigger: (id: string) => void;
  onTriggerKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => void;
  onLinkClick: (persona: PersonaItem, link: AnyLink) => void;
  headerRef: React.RefObject<HTMLElement | null>;
  prefersReducedMotion?: boolean;
  disablePointerAim?: boolean;
  aimOpenDelay?: number;
  aimCloseDelay?: number;
  aimBuffer?: number;
};

type PersonaMenuSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  surfaceVars: React.CSSProperties;
};

const PersonaMenuSurface = React.forwardRef<
  HTMLDivElement,
  PersonaMenuSurfaceProps
>(({ className, surfaceVars, style, children, ...rest }, ref) => {
  const mergedStyle = React.useMemo(
    () => ({ ...(style ?? {}), ...surfaceVars, marginTop: "-1px" }),
    [style, surfaceVars],
  );

  return (
    <div
      ref={ref}
      className={className ? `menu ${className}` : "menu"}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
});

PersonaMenuSurface.displayName = "PersonaMenuSurface";

function useIsPointerCoarse(): boolean {
  const [coarse, setCoarse] = React.useState(false);

  React.useEffect(() => {
    const query = globalThis.matchMedia?.("(pointer: coarse)");
    if (!query) {
      return;
    }
    const update = () => setCoarse(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener?.(update);
    return () => query.removeListener?.(update);
  }, []);

  return coarse;
}

/**
 * Persona-aware dropdown menu that keeps the floating surface open while users
 * move the pointer between trigger and submenu using Floating UI's safePolygon.
 * Keyboard access mirrors Radix Dropdown semantics and coarse pointers degrade
 * to click/tap toggles.
 */
export default function NestableMenu({
  persona,
  pathname,
  isOpen,
  onOpenChange,
  registerTrigger,
  focusTrigger,
  onTriggerKeyDown,
  onLinkClick,
  headerRef,
  prefersReducedMotion = false,
  disablePointerAim = false,
  aimOpenDelay = 110,
  aimCloseDelay = 160,
  aimBuffer = 6,
}: NestableMenuProps): React.ReactNode {
  const triggerNodeRef = React.useRef<HTMLButtonElement | null>(null);
  const panelSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const positionedPanelRef = React.useRef<HTMLElement | null>(null);
  const shadowContextRef = React.useRef<ShadowPortalContext | null>(null);
  const isPointerCoarse = useIsPointerCoarse();

  const links = React.useMemo(
    () =>
      (persona.children ?? []).filter(
        (c): c is AnyLink => c.kind === "link" || c.kind === "external",
      ),
    [persona.children],
  );

  const hasLinks = links.length > 0;
  const [keyboardPressedId, setKeyboardPressedId] = React.useState<
    string | null
  >(null);

  const surfaceVars = React.useMemo(
    () =>
      ({
        "--pm-surface": "var(--color-surface)",
        "--pm-ink": "var(--color-ink-strong)",
        "--pm-outline": "var(--color-outline-subtle)",
        "--pm-surface-hover": "var(--color-surface-hover)",
        "--pm-surface-active": "var(--color-surface-pressed, #eef2fb)",
        "--pm-item-bg": "var(--surface-muted, rgba(226, 232, 240, 0.6))",
        "--pm-item-hover": "var(--surface-hover, rgba(226, 232, 240, 0.85))",
        "--pm-item-border": "var(--border-subtle, rgba(148, 163, 184, 0.8))",
        "--pm-item-border-active":
          "var(--border-strong, rgba(148, 163, 184, 1))",
        "--pm-ring": "var(--ring, rgba(59, 130, 246, 0.45))",
        "--pm-badge-bg": "var(--blue)",
        "--pm-badge-fg": "var(--text-on-blue)",
        "--pm-frame": "var(--green)",
      }) as React.CSSProperties,
    [],
  );

  const handlePortalReady = React.useCallback(
    (context: ShadowPortalContext | null) => {
      shadowContextRef.current = context;
    },
    [],
  );

  const setPanelSurface = React.useCallback((node: HTMLDivElement | null) => {
    panelSurfaceRef.current = node;
    positionedPanelRef.current = node?.closest(POPPER_WRAPPER_SELECTOR) ?? node;
    if (!node) {
      return;
    }
    node.setAttribute("data-nav-dropdown", "true");
    node.style.boxSizing = "border-box";
    node.style.removeProperty("min-width");
    node.style.removeProperty("max-width");
    node.style.removeProperty("width");
    const wrapper = node.closest(POPPER_WRAPPER_SELECTOR) as HTMLElement | null;
    if (wrapper) {
      wrapper.setAttribute("data-nav-dropdown-wrapper", "true");
      wrapper.style.boxSizing = "border-box";
      wrapper.style.width = "auto";
      wrapper.style.minWidth = "auto";
      wrapper.style.maxWidth = "none";
      wrapper.style.setProperty("padding", "0");
      wrapper.style.setProperty("margin", "0");
    }
  }, []);

  const positionPanel = React.useCallback(() => {
    const triggerNode = triggerNodeRef.current;
    const panelNode = positionedPanelRef.current;
    if (!triggerNode || !panelNode) return;

    const header = headerRef.current ?? triggerNode.closest("header");
    if (!header) return;

    const headerRect = header.getBoundingClientRect();
    const triggerRect = triggerNode.getBoundingClientRect();
    const top = Math.round(headerRect.bottom) - 1;

    panelNode.style.position = "fixed";
    panelNode.style.top = `${top}px`;
    panelNode.style.left = `${Math.round(triggerRect.left)}px`;
    panelNode.style.right = "auto";
    panelNode.style.bottom = "auto";
    panelNode.style.transform = "none";
    panelNode.style.setProperty("transform", "none");
    panelNode.style.margin = "0";
    panelNode.style.minWidth = "";
  }, [headerRef]);

  const aim = useMenuAim({
    id: persona.id,
    open: isOpen,
    onOpenChange: React.useCallback(
      (next: boolean) => {
        onOpenChange(persona.id, next);
      },
      [onOpenChange, persona.id],
    ),
    openDelay: prefersReducedMotion ? 0 : aimOpenDelay,
    closeDelay: prefersReducedMotion ? 0 : aimCloseDelay,
    buffer: aimBuffer,
    enabled: !disablePointerAim && !isPointerCoarse,
    placement: "bottom-start",
  });

  React.useEffect(() => {
    const node = triggerNodeRef.current;
    if (!node) return;
    const ownerWindow = node.ownerDocument?.defaultView;
    const raf =
      ownerWindow?.requestAnimationFrame ?? globalThis.requestAnimationFrame;
    if (typeof raf === "function") {
      const handle = raf(() => positionPanel());
      return () => {
        const cancel =
          ownerWindow?.cancelAnimationFrame ?? globalThis.cancelAnimationFrame;
        if (typeof cancel === "function") {
          cancel(handle);
        }
      };
    }
    positionPanel();
    return undefined;
  }, [isOpen, positionPanel]);

  React.useEffect(() => {
    const panelNode = positionedPanelRef.current;
    const triggerNode = triggerNodeRef.current;
    if (!panelNode || !triggerNode || !isOpen) return;
    const doc = triggerNode.ownerDocument;
    const win = doc?.defaultView;
    if (!win) return;

    positionPanel();

    const handleUpdate = () => positionPanel();
    const ResizeObserverCtor = win.ResizeObserver ?? globalThis.ResizeObserver;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserverCtor === "function") {
      ro = new ResizeObserverCtor(() => positionPanel());
      ro.observe(triggerNode);
      ro.observe(doc.body);
    }
    win.addEventListener("resize", handleUpdate);
    win.addEventListener("scroll", handleUpdate, true);

    return () => {
      win.removeEventListener("resize", handleUpdate);
      win.removeEventListener("scroll", handleUpdate, true);
      if (ro) ro.disconnect();
      panelNode.style.removeProperty("position");
      panelNode.style.removeProperty("top");
      panelNode.style.removeProperty("left");
      panelNode.style.removeProperty("right");
      panelNode.style.removeProperty("bottom");
      panelNode.style.removeProperty("transform");
      panelNode.style.removeProperty("margin");
      panelNode.style.removeProperty("min-width");
    };
  }, [isOpen, positionPanel]);

  React.useEffect(() => {
    if (!isOpen && keyboardPressedId !== null) {
      setKeyboardPressedId(null);
    }
  }, [isOpen, keyboardPressedId]);

  const menuItems = React.useMemo(
    () =>
      links.map((linkNode) => {
        const href = linkNode.href;
        const active = isActiveHref(pathname, href);
        const hotkey = readHotkey(linkNode);
        const badge = linkNode.badge?.text;
        const prefetch = linkNode.kind === "link";
        const target =
          linkNode.kind === "external"
            ? (linkNode.target ?? "_blank")
            : undefined;
        const rel = target === "_blank" ? "noreferrer noopener" : undefined;
        const menuItemTestId = linkNode.featureKey
          ? `menu-item-${linkNode.featureKey}`
          : `menu-item-${linkNode.id}`;
        const isKeyboardPressed = keyboardPressedId === linkNode.id;

        const metaItems: React.ReactNode[] = [];
        if (badge) {
          metaItems.push(
            <span
              className="badge"
              data-tone={linkNode.badge?.tone || "new"}
              key="badge"
            >
              {badge}
            </span>,
          );
        }
        if (hotkey) {
          metaItems.push(
            <span className="hotkey" key="hotkey">
              {hotkey}
            </span>,
          );
        }

        return (
          <DropdownMenu.Item
            key={linkNode.id}
            asChild
            data-active={active ? "true" : undefined}
          >
            <Link
              href={href ?? "#"}
              prefetch={prefetch}
              target={target}
              rel={rel}
              className="item"
              data-testid={menuItemTestId}
              data-pressed={isKeyboardPressed ? "true" : undefined}
              onClick={() => {
                onLinkClick(persona, linkNode);
              }}
              onKeyDown={(event) => {
                if (
                  !event.defaultPrevented &&
                  (event.key === " " || event.key === "Enter")
                ) {
                  setKeyboardPressedId(linkNode.id);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  setKeyboardPressedId((current) =>
                    current === linkNode.id ? null : current,
                  );
                }
              }}
              onBlur={() => {
                setKeyboardPressedId((current) =>
                  current === linkNode.id ? null : current,
                );
              }}
            >
              <span className="icon" aria-hidden="true">
                <Icon name={linkNode.icon} className="pm-icon" />
              </span>
              <span className="label">{linkNode.label}</span>
              {metaItems.length ? (
                <span className="meta">{metaItems}</span>
              ) : null}
            </Link>
          </DropdownMenu.Item>
        );
      }),
    [keyboardPressedId, links, onLinkClick, pathname, persona],
  );

  const referenceProps = React.useMemo(
    () => aim.getReferenceProps<Record<string, unknown>>({}),
    [aim],
  );

  const floatingProps = React.useMemo(
    () => aim.getFloatingProps<Record<string, unknown>>({}),
    [aim],
  );

  const setTriggerRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerNodeRef.current = node;
      aim.reference(node);
      registerTrigger(persona.id, node);
      if (node) {
        const ownerWindow = node.ownerDocument?.defaultView;
        const raf =
          ownerWindow?.requestAnimationFrame ??
          globalThis.requestAnimationFrame;
        if (typeof raf === "function") {
          raf(() => positionPanel());
        } else {
          positionPanel();
        }
      }
    },
    [aim, persona.id, positionPanel, registerTrigger],
  );

  const floatingStylelessProps = React.useMemo(() => {
    const { style: _style, ...rest } = floatingProps;
    return rest;
  }, [floatingProps]);

  React.useEffect(() => {
    if (TEST_MODE || process.env.NODE_ENV === "test") return;
    if (
      !isOpen ||
      process.env.NODE_ENV === "production" ||
      !shadowContextRef.current
    ) {
      return;
    }

    const { shadowRoot } = shadowContextRef.current;
    const frame = window.requestAnimationFrame(() => {
      const label = shadowRoot.querySelector(".label") as HTMLElement | null;
      if (!label) return;
      const computed = window.getComputedStyle(label);
      console.table({
        width: label.getBoundingClientRect().width.toFixed(2),
        whiteSpace: computed.whiteSpace,
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        minWidth: computed.minWidth,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!hasLinks) {
    return null;
  }

  const menuId = `${persona.id}-persona-menu`;

  return (
    <DropdownMenu.Root modal={false} open={isOpen} onOpenChange={aim.setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          {...referenceProps}
          ref={setTriggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          className={[
            "group inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors",
            "bg-blue/0 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            isOpen ? "bg-white/20" : "bg-white/0",
          ].join(" ")}
          data-open={isOpen ? "true" : undefined}
          data-testid={`persona-trigger-${persona.id}`}
          data-persona-trigger={persona.id}
          onFocus={(event) => {
            const handler = referenceProps.onFocus as
              | ((ev: React.FocusEvent<HTMLButtonElement>) => void)
              | undefined;
            handler?.(event);
            if (!event.defaultPrevented) {
              aim.setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            const handler = referenceProps.onKeyDown as
              | ((ev: React.KeyboardEvent<HTMLButtonElement>) => void)
              | undefined;
            handler?.(event);
            onTriggerKeyDown(event, persona.id);
          }}
        >
          <Icon name={persona.icon} className="mr-2 size-4 shrink-0" />
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span>{persona.label}</span>
            <Lucide.ChevronDown
              className="size-3 shrink-0 transition-transform duration-200 group-data-[open=true]:rotate-180"
              aria-hidden="true"
            />
          </span>
        </button>
      </DropdownMenu.Trigger>
      {TEST_MODE ? (
        <DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={0}
          collisionPadding={0}
          avoidCollisions
          loop
          aria-label={`Persona menu: ${persona.label}`}
          data-nav-dropdown="true"
          asChild
        >
          <div
            {...floatingStylelessProps}
            className="menu"
            data-nav-dropdown="true"
            data-persona={persona.persona}
            data-persona-menu={persona.id}
            data-state={isOpen ? "open" : "closed"}
            role="menu"
            hidden={!isOpen}
            ref={(node) => {
              aim.floating(node);
              setPanelSurface(node);
            }}
            onFocusCapture={() => aim.setOpen(true)}
            onBlurCapture={(event) => {
              const next = event.relatedTarget as HTMLElement | null;
              if (next && event.currentTarget.contains(next)) {
                return;
              }
              aim.setOpen(false);
            }}
          >
            <div className="list">{menuItems}</div>
          </div>
        </DropdownMenu.Content>
      ) : (
        <DropdownMenu.Portal forceMount>
          <ShadowPortal
            styleText={PERSONA_MENU_CSS}
            onReady={handlePortalReady}
          >
            <DropdownMenu.Content
              side="bottom"
              align="start"
              sideOffset={0}
              collisionPadding={0}
              avoidCollisions
              loop
              aria-label={`Persona menu: ${persona.label}`}
              data-nav-dropdown="true"
              asChild
            >
              <PersonaMenuSurface
                {...floatingStylelessProps}
                id={menuId}
                surfaceVars={surfaceVars}
                data-persona={persona.persona}
                data-persona-menu={persona.id}
                data-state={isOpen ? "open" : "closed"}
                role="menu"
                hidden={!isOpen}
                ref={(node) => {
                  aim.floating(node);
                  setPanelSurface(node);
                }}
                onFocusCapture={() => aim.setOpen(true)}
                onBlurCapture={(event) => {
                  const next = event.relatedTarget as HTMLElement | null;
                  if (next && event.currentTarget.contains(next)) {
                    return;
                  }
                  aim.setOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    aim.setOpen(false);
                    focusTrigger(persona.id);
                  }
                }}
              >
                <div className="list">{menuItems}</div>
              </PersonaMenuSurface>
            </DropdownMenu.Content>
          </ShadowPortal>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  );
}
