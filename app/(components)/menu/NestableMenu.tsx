"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Lucide from "lucide-react";
import type { PersonaItem } from "@/types/nav";
import ShadowPortal, {
  PERSONA_MENU_CSS,
  type ShadowPortalContext,
} from "@/components/ui/ShadowPortal";
import { useMenuAim, CLOSE_DELAY_MS } from "@/app/(components)/menu/useMenuAim";
import { useLastPointerType } from "@/hooks/useLastPointerType";
import { useOpenShield } from "@/hooks/useOpenShield";
import {
  AnyLink,
  Icon,
  PERSONA_EMOJI,
  isActiveHref,
  readHotkey,
} from "@/components/nav/menuUtils";

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

const POPPER_WRAPPER_SELECTOR = "[data-radix-popper-content-wrapper]";

function isHoverCapablePointer(
  pointerType: string | null | undefined,
): boolean {
  return pointerType !== "touch" && pointerType !== "pen";
}

type OutsideEvent = Event & {
  preventDefault(): void;
};

type NestableMenuProps = {
  persona: PersonaItem;
  pathname: string;
  isOpen: boolean;
  onOpenChange: (id: string, open: boolean) => void;
  registerTrigger: (id: string, node: HTMLButtonElement | null) => void;
  registerPointerShield: (id: string, guard: (() => boolean) | null) => void;
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
  registerPointerShield,
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
  const personaEmoji = PERSONA_EMOJI[persona.persona];
  const triggerNodeRef = React.useRef<HTMLButtonElement | null>(null);
  const panelSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const positionedPanelRef = React.useRef<HTMLElement | null>(null);
  const shadowContextRef = React.useRef<ShadowPortalContext | null>(null);
  const isPointerCoarse = useIsPointerCoarse();
  const [lockedByPointer, setLockedByPointer] = React.useState(false);
  const {
    setFromPointerEvent,
    setKeyboard,
    get: getLastPointerKind,
  } = useLastPointerType();
  const { arm: armOpenShield, shouldIgnore: shouldIgnoreOutside } =
    useOpenShield();
  const awaitingPointerUpRef = React.useRef(false);
  const pointerToggleKindRef = React.useRef<"mouse" | "touch" | "pen" | null>(
    null,
  );
  const skipNextClickRef = React.useRef(false);
  const [hoverSuspended, setHoverSuspended] = React.useState(false);

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
  const previousIsOpenRef = React.useRef(isOpen);

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

  React.useEffect(() => {
    registerPointerShield(persona.id, shouldIgnoreOutside);
    return () => registerPointerShield(persona.id, null);
  }, [persona.id, registerPointerShield, shouldIgnoreOutside]);

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
        if (next && suppressReopenRef.current) {
          return;
        }
        onOpenChange(persona.id, next);
      },
      [onOpenChange, persona.id],
    ),
    openDelay: prefersReducedMotion ? 0 : aimOpenDelay,
    closeDelay: prefersReducedMotion ? 0 : aimCloseDelay,
    buffer: aimBuffer,
    enabled:
      !disablePointerAim &&
      !isPointerCoarse &&
      !lockedByPointer &&
      !hoverSuspended,
    placement: "bottom-start",
  });

  const isTargetWithinInteractiveArea = React.useCallback(
    (target: EventTarget | null) => {
      const supportsNode = typeof Node !== "undefined";
      if (!supportsNode || !target || !(target instanceof Node)) {
        return false;
      }
      const trigger = triggerNodeRef.current;
      if (trigger && (target === trigger || trigger.contains(target))) {
        return true;
      }
      const panel = positionedPanelRef.current;
      if (panel && panel.contains(target)) {
        return true;
      }
      return false;
    },
    [],
  );

  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const skipFocusOpenRef = React.useRef(false);
  const suppressReopenRef = React.useRef(false);

  const cancelPendingClose = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleCloseForMouse = React.useCallback(
    (nextTarget: EventTarget | null) => {
      if (isTargetWithinInteractiveArea(nextTarget)) {
        cancelPendingClose();
        return;
      }
      if (!isOpen) {
        cancelPendingClose();
        return;
      }
      if (lockedByPointer) {
        cancelPendingClose();
        return;
      }
      const lastKind = getLastPointerKind();
      if (lastKind === "touch") {
        cancelPendingClose();
        return;
      }
      cancelPendingClose();
      suppressReopenRef.current = true;
      closeTimerRef.current = setTimeout(() => {
        suppressReopenRef.current = true;
        aim.setOpen(false);
        setHoverSuspended(true);
        skipFocusOpenRef.current = true;
        closeTimerRef.current = null;
      }, CLOSE_DELAY_MS);
    },
    [
      aim,
      cancelPendingClose,
      getLastPointerKind,
      isOpen,
      isTargetWithinInteractiveArea,
      setHoverSuspended,
      lockedByPointer,
    ],
  );

  const closeByExplicitDismissal = React.useCallback(() => {
    if (!isOpen) {
      return;
    }
    cancelPendingClose();
    awaitingPointerUpRef.current = false;
    pointerToggleKindRef.current = null;
    skipNextClickRef.current = false;
    setHoverSuspended(false);
    setLockedByPointer(false);
    suppressReopenRef.current = false;
    skipFocusOpenRef.current = true;
    aim.setOpen(false);
  }, [aim, cancelPendingClose, isOpen, setHoverSuspended, setLockedByPointer]);

  React.useEffect(() => {
    if (!isOpen) {
      cancelPendingClose();
    }
  }, [cancelPendingClose, isOpen]);

  React.useEffect(() => {
    if (lockedByPointer) {
      cancelPendingClose();
    }
  }, [cancelPendingClose, lockedByPointer]);

  React.useEffect(
    () => () => {
      cancelPendingClose();
    },
    [cancelPendingClose],
  );

  React.useEffect(() => {
    const trigger = triggerNodeRef.current;
    const doc = trigger?.ownerDocument;
    if (!doc) {
      return;
    }
    const handleGlobalPointer = (event: Event) => {
      setFromPointerEvent(event as any);
      if (!isOpen) {
        return;
      }
      scheduleCloseForMouse(event.target);
    };
    doc.addEventListener("pointermove", handleGlobalPointer, true);
    doc.addEventListener("mousemove", handleGlobalPointer, true);
    return () => {
      doc.removeEventListener("pointermove", handleGlobalPointer, true);
      doc.removeEventListener("mousemove", handleGlobalPointer, true);
    };
  }, [isOpen, scheduleCloseForMouse, setFromPointerEvent]);

  React.useEffect(() => {
    if (!isOpen || !lockedByPointer) {
      return;
    }
    const trigger = triggerNodeRef.current;
    const doc = trigger?.ownerDocument;
    if (!doc) {
      return;
    }
    const withinInteractive = (target: EventTarget | null) => {
      if (!target || !(target instanceof Node)) {
        return false;
      }
      if (trigger && trigger.contains(target)) {
        return true;
      }
      const panel = positionedPanelRef.current;
      if (panel && panel.contains(target)) {
        return true;
      }
      return false;
    };

    const handlePointerDownCapture = (event: Event) => {
      if (withinInteractive(event.target)) {
        return;
      }
      closeByExplicitDismissal();
    };

    const handleKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      closeByExplicitDismissal();
    };

    const handleFocusInCapture = (event: FocusEvent) => {
      if (withinInteractive(event.target)) {
        return;
      }
      closeByExplicitDismissal();
    };

    doc.addEventListener("pointerdown", handlePointerDownCapture, true);
    doc.addEventListener("mousedown", handlePointerDownCapture, true);
    doc.addEventListener("click", handlePointerDownCapture, true);
    doc.addEventListener("keydown", handleKeyDownCapture, true);
    doc.addEventListener("focusin", handleFocusInCapture, true);

    return () => {
      doc.removeEventListener("pointerdown", handlePointerDownCapture, true);
      doc.removeEventListener("mousedown", handlePointerDownCapture, true);
      doc.removeEventListener("click", handlePointerDownCapture, true);
      doc.removeEventListener("keydown", handleKeyDownCapture, true);
      doc.removeEventListener("focusin", handleFocusInCapture, true);
    };
  }, [closeByExplicitDismissal, isOpen, lockedByPointer]);

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

  React.useEffect(() => {
    if (previousIsOpenRef.current && !isOpen && lockedByPointer) {
      setLockedByPointer(false);
    }
    previousIsOpenRef.current = isOpen;
  }, [isOpen, lockedByPointer]);

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
        const overviewMatch =
          linkNode.id === "overview" ||
          linkNode.label?.toLowerCase() === "overview" ||
          (linkNode.featureKey?.endsWith(".overview") ?? false);
        const menuItemTestId = overviewMatch
          ? `nav-menu-${persona.persona}-overview`
          : linkNode.featureKey
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

        const linkContent = (
          <>
            <span className="icon" aria-hidden="true">
              <Icon name={linkNode.icon} className="pm-icon" />
            </span>
            <span className="label">{linkNode.label}</span>
            {metaItems.length ? (
              <span className="meta">{metaItems}</span>
            ) : null}
          </>
        );

        if (linkNode.kind === "external") {
          return (
            <DropdownMenu.Item
              key={linkNode.id}
              asChild
              data-active={active ? "true" : undefined}
            >
              <a
                href={href}
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
                {linkContent}
              </a>
            </DropdownMenu.Item>
          );
        }

        return (
          <DropdownMenu.Item
            key={linkNode.id}
            asChild
            data-active={active ? "true" : undefined}
          >
            <Link
              href={href as Route}
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
              {linkContent}
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

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setFromPointerEvent(event);
      cancelPendingClose();
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      const pointerType = event.pointerType;
      const supportsHover = isHoverCapablePointer(pointerType);

      if (!supportsHover) {
        awaitingPointerUpRef.current = true;
        pointerToggleKindRef.current = pointerType === "pen" ? "pen" : "touch";
        skipNextClickRef.current = true;
        event.preventDefault();
        event.stopPropagation();
        const nativeEvent = event.nativeEvent as PointerEvent | undefined;
        nativeEvent?.stopImmediatePropagation?.();
        return;
      }

      if (event.button === 0) {
        awaitingPointerUpRef.current = true;
        pointerToggleKindRef.current = "mouse";
        skipNextClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        const nativeEvent = event.nativeEvent as PointerEvent | undefined;
        nativeEvent?.stopImmediatePropagation?.();
        return;
      } else {
        pointerToggleKindRef.current = null;
      }

      const handler = referenceProps.onPointerDown as
        | ((ev: React.PointerEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
    },
    [cancelPendingClose, referenceProps, setFromPointerEvent],
  );

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setFromPointerEvent(event);
      cancelPendingClose();
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      const toggleKind = pointerToggleKindRef.current;

      if (awaitingPointerUpRef.current && toggleKind) {
        awaitingPointerUpRef.current = false;
        pointerToggleKindRef.current = null;
        const next = !isOpen;
        setLockedByPointer(next);
        aim.setOpen(next);

        if (toggleKind === "mouse") {
          skipNextClickRef.current = true;
        }

        if (next) {
          setHoverSuspended(false);
          armOpenShield();
          if (event.currentTarget !== document.activeElement) {
            event.currentTarget.focus({ preventScroll: true });
          }
        } else {
          if (toggleKind === "mouse") {
            setHoverSuspended(true);
            setKeyboard();
          } else {
            setHoverSuspended(false);
          }
        }

        if (toggleKind === "mouse") {
          event.preventDefault();
        }
        return;
      }

      awaitingPointerUpRef.current = false;
      pointerToggleKindRef.current = null;

      const handler = referenceProps.onPointerUp as
        | ((ev: React.PointerEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
    },
    [
      aim,
      armOpenShield,
      cancelPendingClose,
      isOpen,
      referenceProps,
      setFromPointerEvent,
      setHoverSuspended,
      setKeyboard,
      setLockedByPointer,
    ],
  );

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setFromPointerEvent(event);
      cancelPendingClose();
      if (!isHoverCapablePointer(event.pointerType)) {
        return;
      }
      setHoverSuspended(false);
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      if (lockedByPointer) {
        return;
      }
      if (hoverSuspended) {
        return;
      }
      const handler = referenceProps.onPointerEnter as
        | ((ev: React.PointerEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
    },
    [
      cancelPendingClose,
      hoverSuspended,
      lockedByPointer,
      referenceProps,
      setFromPointerEvent,
      setHoverSuspended,
    ],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setFromPointerEvent(event);
      cancelPendingClose();
      if (!isHoverCapablePointer(event.pointerType)) {
        return;
      }
      if (lockedByPointer) {
        return;
      }
      if (hoverSuspended) {
        return;
      }
      const handler = referenceProps.onPointerMove as
        | ((ev: React.PointerEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
    },
    [
      cancelPendingClose,
      hoverSuspended,
      lockedByPointer,
      referenceProps,
      setFromPointerEvent,
    ],
  );

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setFromPointerEvent(event);
      cancelPendingClose();
      if (!isHoverCapablePointer(event.pointerType)) {
        awaitingPointerUpRef.current = false;
        scheduleCloseForMouse(event.relatedTarget);
        return;
      }
      setHoverSuspended(false);
      if (lockedByPointer) {
        scheduleCloseForMouse(event.relatedTarget);
        return;
      }
      const handler = referenceProps.onPointerLeave as
        | ((ev: React.PointerEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
      scheduleCloseForMouse(event.relatedTarget);
    },
    [
      cancelPendingClose,
      lockedByPointer,
      referenceProps,
      scheduleCloseForMouse,
      setFromPointerEvent,
      setHoverSuspended,
    ],
  );

  const handleMouseEnter = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setFromPointerEvent({ pointerType: "mouse" });
      cancelPendingClose();
      setHoverSuspended(false);
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      if (lockedByPointer) {
        return;
      }
      if (hoverSuspended) {
        return;
      }
      const handler = referenceProps.onMouseEnter as
        | ((ev: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
    },
    [
      cancelPendingClose,
      hoverSuspended,
      lockedByPointer,
      referenceProps,
      setFromPointerEvent,
      setHoverSuspended,
    ],
  );

  const handleMouseLeave = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setFromPointerEvent({ pointerType: "mouse" });
      cancelPendingClose();
      setHoverSuspended(false);
      if (lockedByPointer) {
        scheduleCloseForMouse(event.relatedTarget);
        return;
      }
      const handler = referenceProps.onMouseLeave as
        | ((ev: React.MouseEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
      scheduleCloseForMouse(event.relatedTarget);
    },
    [
      cancelPendingClose,
      lockedByPointer,
      referenceProps,
      scheduleCloseForMouse,
      setFromPointerEvent,
      setHoverSuspended,
    ],
  );

  const handlePointerCancel = React.useCallback(() => {
    awaitingPointerUpRef.current = false;
    setHoverSuspended(false);
    cancelPendingClose();
  }, [cancelPendingClose, setHoverSuspended]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      cancelPendingClose();
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      if (skipNextClickRef.current) {
        skipNextClickRef.current = false;
        return;
      }
      const kind = getLastPointerKind();
      const isPointerClick =
        kind === "mouse" || kind === "touch" || kind === "pen";

      if (!isPointerClick) {
        const handler = referenceProps.onClick as
          | ((ev: React.MouseEvent<HTMLButtonElement>) => void)
          | undefined;
        handler?.(event);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!isOpen) {
        setHoverSuspended(false);
        setLockedByPointer(true);
        aim.setOpen(true);
        armOpenShield();
        if (event.currentTarget !== document.activeElement) {
          event.currentTarget.focus({ preventScroll: true });
        }
        return;
      }

      if (lockedByPointer) {
        setHoverSuspended(true);
        setLockedByPointer(false);
        aim.setOpen(false);
        setKeyboard();
        return;
      }

      setHoverSuspended(false);
      setLockedByPointer(true);
      aim.setOpen(true);
      armOpenShield();
      if (event.currentTarget !== document.activeElement) {
        event.currentTarget.focus({ preventScroll: true });
      }
    },
    [
      aim,
      armOpenShield,
      cancelPendingClose,
      getLastPointerKind,
      isOpen,
      lockedByPointer,
      referenceProps,
      setHoverSuspended,
      setKeyboard,
    ],
  );

  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      const handler = referenceProps.onFocus as
        | ((ev: React.FocusEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
      if (event.defaultPrevented) {
        return;
      }
      const lastKind = getLastPointerKind();
      if (skipFocusOpenRef.current && lastKind !== "keyboard") {
        return;
      }
      if (!isHoverCapablePointer(lastKind)) {
        return;
      }
      skipFocusOpenRef.current = false;
      aim.setOpen(true);
    },
    [aim, getLastPointerKind, referenceProps],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      setKeyboard();
      skipFocusOpenRef.current = false;
      suppressReopenRef.current = false;
      const handler = referenceProps.onKeyDown as
        | ((ev: React.KeyboardEvent<HTMLButtonElement>) => void)
        | undefined;
      handler?.(event);
      if (!isOpen && (event.key === "Enter" || event.key === " ")) {
        setHoverSuspended(false);
        armOpenShield();
      }
      onTriggerKeyDown(event, persona.id);
    },
    [
      armOpenShield,
      isOpen,
      onTriggerKeyDown,
      persona.id,
      referenceProps,
      setHoverSuspended,
      setKeyboard,
    ],
  );

  const floatingProps = React.useMemo(
    () => aim.getFloatingProps<Record<string, unknown>>({}),
    [aim],
  );

  const floatingHandlers = React.useMemo(() => {
    const {
      style: _style,
      onPointerLeave,
      onMouseLeave,
      onPointerEnter,
      onMouseEnter,
      onPointerMove,
      onMouseMove,
      ...rest
    } = floatingProps as Record<string, unknown> & {
      onPointerLeave?: (event: React.PointerEvent<HTMLElement>) => void;
      onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
      onPointerEnter?: (event: React.PointerEvent<HTMLElement>) => void;
      onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
      onPointerMove?: (event: React.PointerEvent<HTMLElement>) => void;
      onMouseMove?: (event: React.MouseEvent<HTMLElement>) => void;
    };

    return {
      props: rest,
      onPointerLeave: onPointerLeave as
        | ((event: React.PointerEvent<HTMLElement>) => void)
        | undefined,
      onMouseLeave: onMouseLeave as
        | ((event: React.MouseEvent<HTMLElement>) => void)
        | undefined,
      onPointerEnter: onPointerEnter as
        | ((event: React.PointerEvent<HTMLElement>) => void)
        | undefined,
      onMouseEnter: onMouseEnter as
        | ((event: React.MouseEvent<HTMLElement>) => void)
        | undefined,
      onPointerMove: onPointerMove as
        | ((event: React.PointerEvent<HTMLElement>) => void)
        | undefined,
      onMouseMove: onMouseMove as
        | ((event: React.MouseEvent<HTMLElement>) => void)
        | undefined,
    };
  }, [floatingProps]);

  const handlePointerDownOutside = React.useCallback(
    (event: OutsideEvent) => {
      if (shouldIgnoreOutside()) {
        event.preventDefault();
        return;
      }
      if (lockedByPointer) {
        closeByExplicitDismissal();
        return;
      }
      cancelPendingClose();
      setHoverSuspended(false);
    },
    [
      cancelPendingClose,
      closeByExplicitDismissal,
      lockedByPointer,
      setHoverSuspended,
      shouldIgnoreOutside,
    ],
  );

  const handleInteractOutside = React.useCallback(
    (event: OutsideEvent) => {
      if (shouldIgnoreOutside()) {
        event.preventDefault();
        return;
      }
      if (lockedByPointer) {
        closeByExplicitDismissal();
        return;
      }
      cancelPendingClose();
      setHoverSuspended(false);
    },
    [
      cancelPendingClose,
      closeByExplicitDismissal,
      lockedByPointer,
      setHoverSuspended,
      shouldIgnoreOutside,
    ],
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

  const floatingStylelessProps = floatingHandlers.props;

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
          data-testid={`nav-top-${persona.persona}`}
          data-persona-trigger={persona.id}
          data-pointer-locked={lockedByPointer ? "true" : undefined}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        >
          {personaEmoji ? (
            <span
              className="emoji mr-2 shrink-0 text-lg leading-none"
              aria-hidden="true"
            >
              {personaEmoji}
            </span>
          ) : null}
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
          onPointerDownOutside={handlePointerDownOutside}
          onInteractOutside={handleInteractOutside}
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
            onPointerEnter={(event) => {
              cancelPendingClose();
              floatingHandlers.onPointerEnter?.(event);
            }}
            onMouseEnter={(event) => {
              cancelPendingClose();
              floatingHandlers.onMouseEnter?.(event);
            }}
            onPointerMove={(event) => {
              cancelPendingClose();
              floatingHandlers.onPointerMove?.(event);
            }}
            onMouseMove={(event) => {
              cancelPendingClose();
              floatingHandlers.onMouseMove?.(event);
            }}
            onPointerLeave={(event) => {
              if (lockedByPointer) {
                return;
              }
              floatingHandlers.onPointerLeave?.(event);
              scheduleCloseForMouse(event.relatedTarget);
            }}
            onMouseLeave={(event) => {
              if (lockedByPointer) {
                return;
              }
              floatingHandlers.onMouseLeave?.(event);
              scheduleCloseForMouse(event.relatedTarget);
            }}
            onBlurCapture={(event) => {
              const next = event.relatedTarget as HTMLElement | null;
              if (next && event.currentTarget.contains(next)) {
                return;
              }
              if (!lockedByPointer) {
                aim.setOpen(false);
              }
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
              onPointerDownOutside={handlePointerDownOutside}
              onInteractOutside={handleInteractOutside}
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
                onPointerEnter={(event) => {
                  cancelPendingClose();
                  floatingHandlers.onPointerEnter?.(event);
                }}
                onMouseEnter={(event) => {
                  cancelPendingClose();
                  floatingHandlers.onMouseEnter?.(event);
                }}
                onPointerMove={(event) => {
                  cancelPendingClose();
                  floatingHandlers.onPointerMove?.(event);
                }}
                onMouseMove={(event) => {
                  cancelPendingClose();
                  floatingHandlers.onMouseMove?.(event);
                }}
                onPointerLeave={(event) => {
                  if (lockedByPointer) {
                    return;
                  }
                  floatingHandlers.onPointerLeave?.(event);
                  scheduleCloseForMouse(event.relatedTarget);
                }}
                onMouseLeave={(event) => {
                  if (lockedByPointer) {
                    return;
                  }
                  floatingHandlers.onMouseLeave?.(event);
                  scheduleCloseForMouse(event.relatedTarget);
                }}
                onBlurCapture={(event) => {
                  const next = event.relatedTarget as HTMLElement | null;
                  if (next && event.currentTarget.contains(next)) {
                    return;
                  }
                  if (!lockedByPointer) {
                    aim.setOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    closeByExplicitDismissal();
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
