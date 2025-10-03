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

type Props = {
  items?: NavItem[]; // Expect personas at top level
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
}: PersonaDropdownProps): React.ReactNode {
  const links = (persona.children ?? []).filter(
    (c) => c.kind === "link" || c.kind === "external",
  );

  const surfaceVars = React.useMemo(
    () =>
      ({
        "--pm-surface": "var(--color-surface)",
        "--pm-ink": "var(--color-ink-strong)",
        "--pm-outline": "var(--color-outline-subtle)",
        "--pm-surface-hover": "var(--color-surface-hover)",
        "--pm-badge-bg": "var(--blue)",
        "--pm-badge-fg": "var(--text-on-blue)",
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

  const triggerRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      registerTrigger(persona.id, node);
    },
    [persona.id, registerTrigger],
  );

  const menuId = `${persona.id}-persona-menu`;

  React.useEffect(() => {
    if (links.length) return;
    registerTrigger(persona.id, null);
  }, [links.length, persona.id, registerTrigger]);

  if (!links.length) {
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
      <DropdownMenu.Portal forceMount>
        <ShadowPortal styleText={PERSONA_MENU_CSS} onReady={handlePortalReady}>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={8}
            avoidCollisions
            loop
            aria-label={`Persona menu: ${persona.label}`}
            asChild
          >
            <PersonaMenuSurface
              id={menuId}
              surfaceVars={surfaceVars}
              data-persona={persona.persona}
              data-persona-menu={persona.id}
              role="menu"
              hidden={!isOpen}
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
              <div className="header">{persona.label}</div>
              <div className="list">
                {links.map((child) => {
                  const href =
                    child.kind === "link" || child.kind === "external"
                      ? child.href
                      : "#";
                  const active = isActiveHref(pathname, href);
                  const hotkey = readHotkey(child as AnyLink);
                  const badge = child.badge?.text;
                  const prefetch = child.kind === "link";
                  const target =
                    child.kind === "external"
                      ? (child.target ?? "_blank")
                      : undefined;
                  const rel =
                    target === "_blank" ? "noreferrer noopener" : undefined;

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
                })}
              </div>
            </PersonaMenuSurface>
          </DropdownMenu.Content>
        </ShadowPortal>
      </DropdownMenu.Portal>
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
    () => ({ ...(style ?? {}), ...surfaceVars }),
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

export default function NavDesktop({ items }: Props): React.ReactNode {
  const pathname = usePathname();
  const personas = (items ?? []).filter(isPersona);

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

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-persona-trigger], [data-persona-menu]")) {
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
  }, [closeNow]);

  const personaIds = React.useMemo(
    () => personas.map((persona) => persona.id),
    [personas],
  );

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
    <nav className="relative z-[var(--z-header)] hidden bg-transparent text-white shadow-sm md:block">
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
