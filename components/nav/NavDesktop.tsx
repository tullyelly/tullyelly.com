"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { NavItem, PersonaItem } from "@/types/nav";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHasReducedMotion } from "@/hooks/use-has-reduced-motion";
import { useCommandMenu } from "@/components/nav/CommandMenu";
import ShadowPortal, {
  PERSONA_MENU_CSS,
  type ShadowPortalContext,
} from "@/components/ui/ShadowPortal";
import { analytics } from "@/lib/analytics";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import type {
  MenuItem,
  MenuPayload,
  PersonaChildren,
  PersonaKey,
} from "@/lib/menu/types";
import { isPersonaKey, PERSONA_KEYS } from "@/lib/menu/types";

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

const POPPER_WRAPPER_SELECTOR = "[data-radix-popper-content-wrapper]";

type Props = {
  menu: MenuPayload;
  childrenMap: PersonaChildren;
};

function isPersona(x: NavItem): x is PersonaItem {
  return x.kind === "persona";
}

function Icon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}): React.ReactNode {
  if (!name) return null;
  const maybeIcon = Lucide[name as keyof typeof Lucide];
  if (typeof maybeIcon !== "function") return null;
  const IconComponent = maybeIcon as LucideIcon;
  return <IconComponent className={className} aria-hidden="true" />;
}

function isActiveHref(pathname: string, href?: string | null): boolean {
  if (!href) return false;
  try {
    const a = pathname.replace(/\/$/, "");
    const b = href.replace(/\/$/, "");
    return a === b || a.startsWith(`${b}/`);
  } catch {
    return false;
  }
}

type AnyLink = Extract<NavItem, { kind: "link" | "external" }>;

function readHotkey(node: AnyLink): string | undefined {
  const anyNode = node as any;
  return anyNode?.meta?.hotkey || node.hotkey;
}

type PersonaOption = {
  key: PersonaKey;
  label: string;
  iconKey?: string;
};

function parsePersonaFromHref(href: string | undefined): PersonaKey | null {
  if (!href) return null;
  try {
    const url = new URL(href, "https://tullyelly.com");
    const personaQuery = url.searchParams.get("persona");
    if (isPersonaKey(personaQuery)) {
      return personaQuery;
    }
    const pathname = url.pathname.replace(/^\/+/, "");
    if (isPersonaKey(pathname)) {
      return pathname;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function derivePersonaKeyFromItem(item: MenuItem): PersonaKey | null {
  const byId = item.id.startsWith("p-") ? item.id.slice(2) : null;
  if (isPersonaKey(byId)) return byId;
  if (isPersonaKey(item.label)) return item.label;
  return parsePersonaFromHref(item.href);
}

function extractPersonaOptions(menu: MenuPayload): PersonaOption[] {
  const section = menu.sections.find((entry) => entry.id === "personas");
  if (!section) return [];
  const options: PersonaOption[] = [];
  for (const item of section.items) {
    const key = derivePersonaKeyFromItem(item);
    if (!key) continue;
    options.push({
      key,
      label: item.label,
      iconKey: item.iconKey,
    });
  }
  return options;
}

function buildPersonaNode(
  option: PersonaOption,
  childrenMap: PersonaChildren,
): PersonaItem | null {
  const items = childrenMap[option.key] ?? [];
  const children: NavItem[] = [];

  for (const item of items) {
    if (!item.href) continue;
    const base = {
      id: item.id,
      label: item.label,
      icon: item.iconKey ?? undefined,
      featureKey: item.feature ?? undefined,
      badge: item.badge,
      hotkey: item.hotkey,
    };
    if (item.external) {
      children.push({
        ...base,
        kind: "external",
        href: item.href,
        target: "_blank",
      });
    } else {
      children.push({
        ...base,
        kind: "link",
        href: item.href,
      });
    }
  }

  return {
    id: `persona.${option.key}`,
    persona: option.key,
    kind: "persona",
    label: option.label,
    icon: option.iconKey,
    children,
  };
}

type PersonaDropdownProps = {
  persona: PersonaItem;
  pathname: string;
  isOpen: boolean;
  openImmediately: (id: string) => void;
  scheduleOpen: (id: string) => void;
  scheduleClose: (id?: string) => void;
  closeNow: (id?: string) => void;
  registerTrigger: (id: string, node: HTMLButtonElement | null) => void;
  focusTrigger: (id: string) => void;
  onTriggerKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => void;
  onLinkClick: (persona: PersonaItem, link: AnyLink) => void;
  headerRef: React.RefObject<HTMLElement | null>;
};

function PersonaDropdown({
  persona,
  pathname,
  isOpen,
  openImmediately,
  scheduleOpen,
  scheduleClose,
  closeNow,
  registerTrigger,
  focusTrigger,
  onTriggerKeyDown,
  onLinkClick,
  headerRef,
}: PersonaDropdownProps): React.ReactNode {
  const triggerNodeRef = React.useRef<HTMLButtonElement | null>(null);
  const panelSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const positionedPanelRef = React.useRef<HTMLElement | null>(null);
  const links = (persona.children ?? []).filter(
    (c) => c.kind === "link" || c.kind === "external",
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

  const shadowContextRef = React.useRef<ShadowPortalContext | null>(null);

  const handlePortalReady = React.useCallback(
    (context: ShadowPortalContext | null) => {
      shadowContextRef.current = context;
    },
    [],
  );

  React.useEffect(() => {
    if (TEST_MODE) return;
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

  const setPanelSurface = React.useCallback((node: HTMLDivElement | null) => {
    panelSurfaceRef.current = node;
    if (!node) {
      positionedPanelRef.current = null;
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
    positionedPanelRef.current = wrapper ?? node;
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

  const triggerRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerNodeRef.current = node;
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
    [persona.id, registerTrigger, positionPanel],
  );

  const menuId = `${persona.id}-persona-menu`;

  React.useEffect(() => {
    if (links.length) return;
    registerTrigger(persona.id, null);
  }, [links.length, persona.id, registerTrigger]);

  React.useEffect(() => {
    const panelNode = positionedPanelRef.current;
    const triggerNode = triggerNodeRef.current;
    if (!panelNode || !triggerNode) return;
    const doc = triggerNode.ownerDocument;
    const win = doc?.defaultView;
    if (!win) return;

    if (!isOpen) {
      panelNode.style.removeProperty("position");
      panelNode.style.removeProperty("top");
      panelNode.style.removeProperty("left");
      panelNode.style.removeProperty("right");
      panelNode.style.removeProperty("bottom");
      panelNode.style.removeProperty("transform");
      panelNode.style.removeProperty("margin");
      panelNode.style.removeProperty("min-width");
      return;
    }

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
      links.map((child) => {
        const linkNode = child as AnyLink;
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
        const isKeyboardPressed = keyboardPressedId === child.id;

        const metaItems: React.ReactNode[] = [];
        if (badge) {
          metaItems.push(
            <span
              className="badge"
              data-tone={child.badge?.tone || "new"}
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
            key={child.id}
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
                  setKeyboardPressedId(child.id);
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  setKeyboardPressedId((current) =>
                    current === child.id ? null : current,
                  );
                }
              }}
              onBlur={() => {
                setKeyboardPressedId((current) =>
                  current === child.id ? null : current,
                );
              }}
            >
              <span className="icon" aria-hidden="true">
                <Icon name={child.icon} className="pm-icon" />
              </span>
              <span className="label">{child.label}</span>
              {metaItems.length ? (
                <span className="meta">{metaItems}</span>
              ) : null}
            </Link>
          </DropdownMenu.Item>
        );
      }),
    [
      keyboardPressedId,
      links,
      onLinkClick,
      pathname,
      persona,
      setKeyboardPressedId,
    ],
  );

  if (!hasLinks) {
    return null;
  }

  return (
    <DropdownMenu.Root
      modal={false}
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          openImmediately(persona.id);
        } else {
          closeNow(persona.id);
        }
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          className={[
            "group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors",
            "bg-blue/0 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            isOpen ? "bg-white/20" : "bg-white/0",
          ].join(" ")}
          data-open={isOpen ? "true" : undefined}
          data-testid={`persona-trigger-${persona.id}`}
          data-persona-trigger={persona.id}
          onPointerEnter={() => scheduleOpen(persona.id)}
          onPointerLeave={() => scheduleClose(persona.id)}
          onFocus={() => openImmediately(persona.id)}
          onKeyDown={(event) => onTriggerKeyDown(event, persona.id)}
        >
          <Icon name={persona.icon} className="size-4" />
          <span>{persona.label}</span>
          <Lucide.ChevronDown
            className="size-3 transition-transform duration-200 group-data-[open=true]:rotate-180"
            aria-hidden="true"
          />
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
            className="menu"
            data-nav-dropdown="true"
            data-persona={persona.persona}
            data-persona-menu={persona.id}
            data-state={isOpen ? "open" : "closed"}
            role="menu"
            hidden={!isOpen}
            ref={setPanelSurface}
            onMouseEnter={() => openImmediately(persona.id)}
            onMouseLeave={() => scheduleClose(persona.id)}
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
                id={menuId}
                surfaceVars={surfaceVars}
                data-persona={persona.persona}
                data-persona-menu={persona.id}
                data-state={isOpen ? "open" : "closed"}
                role="menu"
                hidden={!isOpen}
                ref={(node) => {
                  setPanelSurface(node);
                }}
                onPointerEnter={() => openImmediately(persona.id)}
                onPointerLeave={() => scheduleClose(persona.id)}
                onFocusCapture={() => openImmediately(persona.id)}
                onBlurCapture={(event) => {
                  const next = event.relatedTarget as HTMLElement | null;
                  if (next && event.currentTarget.contains(next)) {
                    return;
                  }
                  scheduleClose(persona.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    closeNow(persona.id);
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

export default function NavDesktop({
  menu,
  childrenMap,
}: Props): React.ReactNode {
  const pathname = usePathname();

  const personaOptions = React.useMemo(() => {
    const extracted = extractPersonaOptions(menu);
    if (extracted.length) {
      return extracted;
    }

    const fallback: PersonaOption[] = [];
    for (const key of PERSONA_KEYS) {
      if ((childrenMap[key] ?? []).length) {
        fallback.push({ key, label: key });
      }
    }

    if (fallback.length) {
      return fallback;
    }

    if (TEST_MODE) {
      return TEST_MENU_ITEMS.filter(isPersona).map((persona) => ({
        key: persona.persona,
        label: persona.label,
        iconKey: persona.icon ?? undefined,
      }));
    }

    return [];
  }, [menu, childrenMap]);

  const personas = React.useMemo(() => {
    const nodes: PersonaItem[] = [];
    for (const option of personaOptions) {
      const node = buildPersonaNode(option, childrenMap);
      if (node) {
        nodes.push(node);
      }
    }

    if (nodes.length) {
      return nodes;
    }

    if (TEST_MODE) {
      return TEST_MENU_ITEMS.filter(isPersona);
    }

    return nodes;
  }, [personaOptions, childrenMap]);
  const personaMeta = React.useMemo(() => {
    const map = new Map<string, PersonaItem>();
    for (const persona of personas) {
      map.set(persona.id, persona);
    }
    return map;
  }, [personas]);

  const { setOpen } = useCommandMenu();
  const openCommand = React.useCallback(() => setOpen(true), [setOpen]);

  const HOVER_OPEN_DELAY = 80;
  const HOVER_CLOSE_DELAY = 180;
  const prefersReduced = useHasReducedMotion();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const triggerRefs = React.useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  );
  const headerRef = React.useRef<HTMLElement | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    if (!navRef.current) return;
    headerRef.current =
      navRef.current.closest("header") ??
      document.getElementById("site-header");
  }, []);

  React.useLayoutEffect(() => {
    setOpenId(null);
  }, []);

  const clearTimer = React.useCallback(
    (timerRef: React.MutableRefObject<number | null>) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  const cancelScheduledClose = React.useCallback(() => {
    clearTimer(closeTimer);
  }, [clearTimer]);

  const openImmediately = React.useCallback(
    (id: string) => {
      cancelScheduledClose();
      clearTimer(openTimer);
      setOpenId(id);
    },
    [cancelScheduledClose, clearTimer],
  );

  const openPersonaRef = React.useRef(openImmediately);
  React.useEffect(() => {
    openPersonaRef.current = openImmediately;
  }, [openImmediately]);

  const scheduleOpen = React.useCallback(
    (id: string) => {
      cancelScheduledClose();
      if (prefersReduced) {
        setOpenId(id);
        return;
      }
      clearTimer(openTimer);
      openTimer.current = window.setTimeout(() => {
        setOpenId(id);
        openTimer.current = null;
      }, HOVER_OPEN_DELAY);
    },
    [cancelScheduledClose, clearTimer, prefersReduced],
  );

  const closeNow = React.useCallback(
    (id?: string) => {
      clearTimer(openTimer);
      clearTimer(closeTimer);
      setOpenId((current) => {
        if (id && current && current !== id) {
          return current;
        }
        return null;
      });
    },
    [clearTimer],
  );

  const scheduleClose = React.useCallback(
    (id?: string) => {
      clearTimer(openTimer);
      if (prefersReduced) {
        setOpenId((current) => {
          if (id && current && current !== id) {
            return current;
          }
          return null;
        });
        return;
      }
      clearTimer(closeTimer);
      closeTimer.current = window.setTimeout(() => {
        setOpenId((current) => {
          if (id && current && current !== id) {
            return current;
          }
          return null;
        });
        closeTimer.current = null;
      }, HOVER_CLOSE_DELAY);
    },
    [clearTimer, prefersReduced],
  );

  React.useEffect(() => {
    return () => {
      clearTimer(openTimer);
      clearTimer(closeTimer);
    };
  }, [clearTimer]);

  const isPersonaMenuNode = React.useCallback((node: EventTarget | null) => {
    if (!(node instanceof Element)) {
      return false;
    }
    return Boolean(
      node.closest("[data-persona-trigger]") ??
        node.closest("[data-persona-menu]"),
    );
  }, []);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target;
      if (isPersonaMenuNode(target)) {
        return;
      }
      const path =
        typeof event.composedPath === "function"
          ? event.composedPath()
          : undefined;
      if (path?.some((node) => isPersonaMenuNode(node))) {
        return;
      }
      closeNow();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNow();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeNow, isPersonaMenuNode]);

  const personaIds = React.useMemo(
    () => personas.map((persona) => persona.id),
    [personas],
  );

  React.useEffect(() => {
    if (!openId) return;
    const persona = personaMeta.get(openId);
    if (!persona) return;
    analytics.track("menu.desktop.open", {
      persona: persona.persona,
      root: persona.label,
    });
  }, [openId, personaMeta]);

  React.useEffect(() => {
    if (!TEST_MODE || typeof globalThis === "undefined") return;
    const scope = globalThis as any;
    const api = scope.__navTest ?? {};
    const openPersona = (id: string) => {
      const trigger = document.querySelector(
        `[data-testid="persona-trigger-${id}"]`,
      ) as HTMLElement | null;
      if (trigger) {
        try {
          trigger.dispatchEvent(
            new PointerEvent("pointerenter", { bubbles: true }),
          );
          trigger.dispatchEvent(
            new PointerEvent("pointermove", { bubbles: true }),
          );
          trigger.dispatchEvent(new Event("mouseenter", { bubbles: true }));
        } catch {
          trigger.dispatchEvent(new Event("mouseover", { bubbles: true }));
        }
      }

      openPersonaRef.current?.(id);

      const content = document.querySelector(
        `[data-persona-menu="${id}"]`,
      ) as HTMLElement | null;
      if (content) {
        content.removeAttribute("hidden");
        content.setAttribute("data-state", "open");
      }
    };

    api.openPersona = openPersona;
    scope.__navTest = api;

    return () => {
      if (scope.__navTest?.openPersona === openPersona) {
        delete scope.__navTest.openPersona;
      }
    };
  }, []);

  const registerTrigger = React.useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        triggerRefs.current.set(id, node);
      } else {
        triggerRefs.current.delete(id);
      }
    },
    [],
  );

  const focusTrigger = React.useCallback((id: string) => {
    const node = triggerRefs.current.get(id);
    if (!node) return;
    window.requestAnimationFrame(() => {
      node.focus();
    });
  }, []);

  const moveFocus = React.useCallback(
    (currentId: string, direction: 1 | -1) => {
      if (!personaIds.length) return;
      const index = personaIds.indexOf(currentId);
      if (index === -1) return;
      const nextIndex =
        (index + direction + personaIds.length) % personaIds.length;
      const nextId = personaIds[nextIndex];
      openImmediately(nextId);
      focusTrigger(nextId);
    },
    [focusTrigger, openImmediately, personaIds],
  );

  const handlePersonaLinkClick = React.useCallback(
    (persona: PersonaItem, link: AnyLink) => {
      analytics.track("menu.desktop.click", {
        path: link.href,
        featureKey: link.featureKey ?? null,
        persona: persona.persona,
      });
    },
    [],
  );

  const handleTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (event.defaultPrevented) return;

      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openImmediately(id);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveFocus(id, 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveFocus(id, -1);
        return;
      }

      if (event.key === "Escape") {
        if (openId === id) {
          event.preventDefault();
          closeNow(id);
        }
      }
    },
    [closeNow, moveFocus, openId, openImmediately],
  );

  if (!personas.length) return null;

  return (
    <nav
      ref={navRef}
      data-testid="nav-desktop"
      className="relative z-[var(--z-header)] hidden bg-transparent text-white shadow-sm md:block"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {personas.map((persona) => (
            <PersonaDropdown
              key={persona.id}
              persona={persona}
              pathname={pathname ?? ""}
              isOpen={openId === persona.id}
              openImmediately={openImmediately}
              scheduleOpen={scheduleOpen}
              scheduleClose={scheduleClose}
              closeNow={closeNow}
              registerTrigger={registerTrigger}
              focusTrigger={focusTrigger}
              onTriggerKeyDown={handleTriggerKeyDown}
              onLinkClick={handlePersonaLinkClick}
              headerRef={headerRef}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={openCommand}
          className="ml-4 inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Lucide.Command className="size-4" aria-hidden="true" />
          <span>Search</span>
          <span className="hidden text-xs opacity-75 lg:inline">⌘K</span>
        </button>
      </div>
    </nav>
  );
}
