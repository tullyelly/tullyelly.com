"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavItem, PersonaItem } from "@/types/nav";
import { analytics } from "@/lib/analytics";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import type {
  MenuItem,
  MenuPayload,
  PersonaChildren,
  PersonaKey,
} from "@/lib/menu/types";
import { isPersonaKey, PERSONA_KEYS } from "@/lib/menu/types";
import { useNavController } from "@/components/nav/NavController";
import { useNavResetOnRouteChange } from "@/hooks/useNavResetOnRouteChange";
import {
  AnyLink,
  Icon,
  isActiveHref,
  normalizePath,
} from "@/components/nav/menuUtils";
import { handleSameRouteNoop, isSameRoute } from "@/components/nav/sameRoute";
import { cn } from "@/lib/utils";
import HeaderUser from "./HeaderUser";

const TEST_MODE =
  process.env.NEXT_PUBLIC_TEST_MODE === "1" || process.env.TEST_MODE === "1";

type Props = {
  menu: MenuPayload;
  childrenMap: PersonaChildren;
};

function isPersona(x: NavItem): x is PersonaItem {
  return x.kind === "persona";
}

type PersonaOption = {
  key: PersonaKey;
  label: string;
  iconKey?: string;
  href?: string;
  external?: boolean;
  feature?: string;
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
      href: item.href,
      external: item.external,
      feature: item.feature,
    });
  }
  return options;
}

function isOverviewLink(item: Pick<AnyLink, "id" | "label" | "featureKey">) {
  return (
    item.id === "overview" ||
    item.label?.toLowerCase() === "overview" ||
    (item.featureKey?.endsWith(".overview") ?? false)
  );
}

function normalizeHrefPath(href?: string | null): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, "https://tullyelly.com");
    return normalizePath(url.pathname);
  } catch {
    return normalizePath(href.split("?")[0] ?? href);
  }
}

function isSameHref(first?: string | null, second?: string | null): boolean {
  const normalizedFirst = normalizeHrefPath(first);
  const normalizedSecond = normalizeHrefPath(second);
  return Boolean(
    normalizedFirst && normalizedSecond && normalizedFirst === normalizedSecond,
  );
}

function isPersonaLandingLink(persona: PersonaItem, link: AnyLink): boolean {
  return normalizeHrefPath(link.href) === `/${persona.persona}`;
}

function isPersonaOptionLandingHref(option: PersonaOption): boolean {
  return normalizeHrefPath(option.href) === `/${option.key}`;
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

  if (
    option.href &&
    isPersonaOptionLandingHref(option) &&
    !children.some(
      (item) =>
        (item.kind === "link" || item.kind === "external") &&
        (isOverviewLink(item) || isSameHref(item.href, option.href)),
    )
  ) {
    const overviewBase = {
      id: "overview",
      label: "Overview",
      icon: option.iconKey,
      featureKey: option.feature,
    };
    children.unshift(
      option.external
        ? {
            ...overviewBase,
            kind: "external",
            href: option.href,
            target: "_blank",
          }
        : {
            ...overviewBase,
            kind: "link",
            href: option.href,
          },
    );
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

function getPersonaLinks(persona: PersonaItem): AnyLink[] {
  return (persona.children ?? []).filter(
    (item): item is AnyLink =>
      !item.hidden && (item.kind === "link" || item.kind === "external"),
  );
}

function getMenuItemTestId(persona: PersonaItem, link: AnyLink): string {
  if (isOverviewLink(link) || isPersonaLandingLink(persona, link)) {
    return `nav-menu-${persona.persona}-overview`;
  }
  return link.featureKey
    ? `menu-item-${link.featureKey}`
    : `menu-item-${link.id}`;
}

function getLinkTarget(link: AnyLink): {
  target?: "_self" | "_blank";
  rel?: string;
} {
  if (link.kind !== "external") return {};
  const target = link.target ?? "_blank";
  return {
    target,
    rel: target === "_blank" ? "noreferrer noopener" : undefined,
  };
}

function getPanelWidthRem(linkCount: number): number {
  if (linkCount === 0) return 24;
  if (linkCount <= 2) return 38;
  return 50;
}

function getPanelColumnCount(linkCount: number): 1 | 2 {
  return linkCount > 2 ? 2 : 1;
}

type DesktopMenuLinkProps = {
  persona: PersonaItem;
  link: AnyLink;
  pathname: string;
  variant?: "primary" | "card";
  onClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    persona: PersonaItem,
    link: AnyLink,
  ): void;
};

function DesktopMenuLink({
  persona,
  link,
  pathname,
  variant = "card",
  onClick,
}: DesktopMenuLinkProps) {
  const active = isActiveHref(pathname, link.href);
  const { target, rel } = getLinkTarget(link);
  const primary = variant === "primary";

  return (
    <Link
      href={link.href}
      target={target}
      rel={rel}
      data-testid={getMenuItemTestId(persona, link)}
      data-desktop-menu-link
      data-menu-variant={variant}
      aria-current={active ? "page" : undefined}
      onClick={(event) => onClick(event, persona, link)}
      className={cn(
        "group flex min-h-14 items-center gap-4 rounded-lg border text-left no-underline transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue)] focus-visible:ring-offset-2",
        primary
          ? "border-[color:var(--blue)] bg-[color:var(--blue)] px-5 py-4 text-white shadow-sm hover:bg-[color:var(--blue-contrast)]"
          : "border-[color:var(--border-subtle)] bg-white px-4 py-3.5 text-[color:var(--ink)] hover:border-[color:var(--blue)] hover:bg-[color:var(--surface-page)]",
        active &&
          (primary
            ? "ring-2 ring-white/70"
            : "border-[color:var(--blue)] bg-[color:var(--surface-page)]"),
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-5">
          {link.label}
        </span>
        {link.badge || link.hotkey ? (
          <span
            className={cn(
              "mt-1 flex items-center gap-2 text-xs font-medium leading-none",
              primary ? "text-white/80" : "text-[color:var(--blue-contrast)]",
            )}
          >
            {link.badge ? (
              <span className="rounded-full bg-black/10 px-2 py-1">
                {link.badge.text}
              </span>
            ) : null}
            {link.hotkey ? <span>{link.hotkey}</span> : null}
          </span>
        ) : null}
      </span>
      <Icon
        name={link.kind === "external" ? "ExternalLink" : "ArrowRight"}
        className={cn(
          "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
          primary ? "text-white" : "text-[color:var(--blue)]",
        )}
      />
    </Link>
  );
}

type DesktopPersonaMenuProps = {
  persona: PersonaItem;
  pathname: string;
  isOpen: boolean;
  active: boolean;
  registerTrigger(id: string, node: HTMLButtonElement | null): void;
  onOpen(id: string): void;
  onClose(): void;
  onMoveFocus(id: string, direction: 1 | -1): void;
  onLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    persona: PersonaItem,
    link: AnyLink,
  ): void;
};

function DesktopPersonaMenu({
  persona,
  pathname,
  isOpen,
  active,
  registerTrigger,
  onOpen,
  onClose,
  onMoveFocus,
  onLinkClick,
}: DesktopPersonaMenuProps) {
  const links = React.useMemo(() => getPersonaLinks(persona), [persona]);
  const overview =
    links.find((link) => isPersonaLandingLink(persona, link)) ??
    links.find(isOverviewLink) ??
    null;
  const panelLinks = links.filter(
    (link) =>
      link.id !== overview?.id &&
      !isOverviewLink(link) &&
      !isPersonaLandingLink(persona, link),
  );
  const hasPanelLinks = panelLinks.length > 0;
  const panelColumnCount = getPanelColumnCount(panelLinks.length);
  const panelWidthRem = getPanelWidthRem(panelLinks.length);
  const panelId = `desktop-menu-panel-${persona.persona}`;
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const suppressCoarseClickRef = React.useRef(false);
  const suppressCoarseClickTimerRef = React.useRef<number | null>(null);
  const [panelLeft, setPanelLeft] = React.useState<number | null>(null);

  const open = React.useCallback(
    () => onOpen(persona.id),
    [onOpen, persona.id],
  );

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") return;
      open();
    },
    [open],
  );

  const clearSuppressCoarseClick = React.useCallback(() => {
    suppressCoarseClickRef.current = false;
    if (suppressCoarseClickTimerRef.current !== null) {
      window.clearTimeout(suppressCoarseClickTimerRef.current);
      suppressCoarseClickTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      clearSuppressCoarseClick();
      suppressCoarseClickRef.current = true;
      suppressCoarseClickTimerRef.current = window.setTimeout(() => {
        suppressCoarseClickRef.current = false;
        suppressCoarseClickTimerRef.current = null;
      }, 800);
      open();
    },
    [clearSuppressCoarseClick, open],
  );

  const handleMouseEnter = React.useCallback(() => {
    if (suppressCoarseClickRef.current) return;
    open();
  }, [open]);

  const handleClick = React.useCallback(() => {
    if (suppressCoarseClickRef.current) {
      clearSuppressCoarseClick();
      open();
      return;
    }

    if (isOpen) {
      onClose();
      return;
    }

    open();
  }, [clearSuppressCoarseClick, isOpen, onClose, open]);

  React.useEffect(() => clearSuppressCoarseClick, [clearSuppressCoarseClick]);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      setPanelLeft(null);
      return;
    }

    const updatePanelLeft = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const triggerRect = trigger.getBoundingClientRect();
      const rootFontSize =
        Number.parseFloat(
          window.getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      const panelWidth = Math.min(
        panelWidthRem * rootFontSize,
        window.innerWidth - 24,
      );
      const left = Math.min(
        Math.max(triggerRect.left, 12),
        window.innerWidth - panelWidth - 12,
      );
      setPanelLeft(Math.round(Math.max(left, 12)));
    };

    updatePanelLeft();
    window.addEventListener("resize", updatePanelLeft);
    return () => {
      window.removeEventListener("resize", updatePanelLeft);
    };
  }, [isOpen, panelWidthRem]);

  const handleTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.defaultPrevented) return;

      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        open();
        window.requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>(
            `[data-persona-menu="${persona.id}"] a`,
          );
          first?.focus();
        });
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onMoveFocus(persona.id, 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onMoveFocus(persona.id, -1);
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onClose, onMoveFocus, open, persona.id],
  );

  return (
    <div className="relative" data-desktop-persona-root={persona.id}>
      <button
        ref={(node) => {
          triggerRef.current = node;
          registerTrigger(persona.id, node);
        }}
        type="button"
        id={`desktop-menu-trigger-${persona.persona}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "group inline-flex h-11 items-center gap-2 rounded-lg px-3.5 text-[15px] font-semibold text-white no-underline transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          isOpen || active ? "bg-white/20" : "bg-white/0 hover:bg-white/10",
        )}
        data-open={isOpen ? "true" : undefined}
        data-testid={`nav-top-${persona.persona}`}
        data-persona-trigger={persona.id}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onMouseEnter={handleMouseEnter}
        onFocus={open}
        onClick={handleClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="whitespace-nowrap">{persona.label}</span>
        <Icon
          name="ChevronDown"
          className="size-3 shrink-0 transition-transform group-data-[open=true]:rotate-180"
        />
      </button>
      <div
        id={panelId}
        data-persona-menu={persona.id}
        data-state={isOpen ? "open" : "closed"}
        aria-labelledby={`desktop-menu-trigger-${persona.persona}`}
        hidden={!isOpen}
        className="fixed top-[var(--header-h)] z-[90] text-[color:var(--ink)]"
        style={{
          left: panelLeft ?? 12,
          width: `${panelWidthRem}rem`,
          maxWidth: "calc(100vw - 1.5rem)",
        }}
      >
        <div className="overflow-hidden rounded-b-lg border border-white/70 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.24)] ring-1 ring-black/10">
          <div
            className={cn(
              "grid",
              hasPanelLinks
                ? "grid-cols-[minmax(14rem,16rem)_minmax(0,1fr)]"
                : "grid-cols-1",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-3 bg-[color:var(--surface-page)] p-4",
                hasPanelLinks && "border-r border-[color:var(--border-subtle)]",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold leading-7">
                  {persona.label}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--blue-contrast)]">
                  alter ego
                </p>
              </div>
              {overview ? (
                <DesktopMenuLink
                  persona={persona}
                  link={overview}
                  pathname={pathname}
                  variant="primary"
                  onClick={onLinkClick}
                />
              ) : null}
            </div>
            {hasPanelLinks ? (
              <div className="p-4">
                <div
                  className={cn(
                    "grid gap-3",
                    panelColumnCount === 2 ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {panelLinks.map((link) => (
                    <DesktopMenuLink
                      key={`${persona.id}-${link.id}`}
                      persona={persona}
                      link={link}
                      pathname={pathname}
                      onClick={onLinkClick}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavDesktop({
  menu,
  childrenMap,
}: Props): React.ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRoute = React.useMemo(() => {
    const path = pathname ?? "/";
    const search = searchParams?.toString() ?? "";
    return search ? `${path}?${search}` : path;
  }, [pathname, searchParams]);
  const { registerCloseHandler } = useNavController();
  useNavResetOnRouteChange();
  const homeActive = isActiveHref(pathname ?? "", "/");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const triggerRefs = React.useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  );
  const closeTimerRef = React.useRef<number | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);

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

  const personaIds = React.useMemo(
    () => personas.map((persona) => persona.id),
    [personas],
  );

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const forceCloseAll = React.useCallback(() => {
    clearCloseTimer();
    setOpenId(null);
    triggerRefs.current.forEach((node) => {
      node?.blur?.();
    });
  }, [clearCloseTimer]);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenId(null);
      closeTimerRef.current = null;
    }, 140);
  }, [clearCloseTimer]);

  const openPersona = React.useCallback(
    (id: string) => {
      clearCloseTimer();
      setOpenId(id);
    },
    [clearCloseTimer],
  );

  React.useEffect(
    () => registerCloseHandler(forceCloseAll),
    [registerCloseHandler, forceCloseAll],
  );

  React.useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  React.useEffect(() => {
    setOpenId(null);
  }, [currentRoute]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && navRef.current?.contains(target)) {
        return;
      }
      forceCloseAll();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        forceCloseAll();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [forceCloseAll]);

  React.useEffect(() => {
    if (!openId) return;
    const persona = personas.find((item) => item.id === openId);
    if (!persona) return;
    analytics.track("menu.desktop.open", {
      persona: persona.persona,
      root: persona.label,
    });
  }, [openId, personas]);

  React.useEffect(() => {
    if (!TEST_MODE || typeof globalThis === "undefined") return;
    const scope = globalThis as any;
    const api = scope.__navTest ?? {};
    const testOpenPersona = (id: string) => {
      openPersona(id);
    };

    api.openPersona = testOpenPersona;
    scope.__navTest = api;

    return () => {
      if (scope.__navTest?.openPersona === testOpenPersona) {
        delete scope.__navTest.openPersona;
      }
    };
  }, [openPersona]);

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
      openPersona(nextId);
      focusTrigger(nextId);
    },
    [focusTrigger, openPersona, personaIds],
  );

  const handlePersonaLinkClick = React.useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      persona: PersonaItem,
      link: AnyLink,
    ) => {
      if (
        link.kind !== "external" &&
        link.href &&
        isSameRoute(currentRoute, link.href)
      ) {
        handleSameRouteNoop(event, forceCloseAll);
        return;
      }

      analytics.track("menu.desktop.click", {
        path: link.href,
        featureKey: link.featureKey ?? null,
        persona: persona.persona,
      });
      setOpenId(null);
    },
    [currentRoute, forceCloseAll],
  );

  if (!personas.length) return null;

  return (
    <nav
      ref={navRef}
      data-testid="nav-desktop"
      className="relative z-[var(--z-header)] hidden bg-transparent text-white shadow-sm md:block"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex w-full max-w-[var(--content-max)] items-center px-6 py-3 md:px-8 md:pl-[var(--bookmark-offset)] lg:px-10">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-hidden">
          <Link
            href="/"
            data-nav-home
            className={cn(
              "relative z-10 inline-flex h-11 items-center gap-2 rounded-lg px-3.5 text-[15px] font-semibold lowercase !text-white !opacity-100 !no-underline transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              homeActive ? "bg-white/20" : "bg-transparent hover:bg-white/10",
            )}
            aria-current={homeActive ? "page" : undefined}
            aria-label="home"
            data-testid="nav-top-home"
            onClick={(event) => {
              if (isSameRoute(currentRoute, "/")) {
                handleSameRouteNoop(event, forceCloseAll);
              }
            }}
          >
            <span>home</span>
          </Link>
          {personas.map((persona) => {
            const active = getPersonaLinks(persona).some((link) =>
              isActiveHref(pathname ?? "", link.href),
            );
            return (
              <DesktopPersonaMenu
                key={persona.id}
                persona={persona}
                pathname={pathname ?? ""}
                isOpen={openId === persona.id}
                active={active}
                registerTrigger={registerTrigger}
                onOpen={openPersona}
                onClose={forceCloseAll}
                onMoveFocus={moveFocus}
                onLinkClick={handlePersonaLinkClick}
              />
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-6 pl-6">
          <HeaderUser />
        </div>
      </div>
    </nav>
  );
}
