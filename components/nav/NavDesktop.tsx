"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavItem, PersonaItem } from "@/types/nav";
import { analytics } from "@/lib/analytics";
import { TEST_MENU_ITEMS } from "@/lib/menu.test-data";
import { isTestMenuModeEnabled } from "@/lib/escape-hatches";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import HeaderUser from "./HeaderUser";
import DesktopSearchTrigger from "./DesktopSearchTrigger";

const TEST_MODE = isTestMenuModeEnabled();

type Props = {
  menu: MenuPayload;
  childrenMap: PersonaChildren;
};

type PersonaOption = {
  key: PersonaKey;
  label: string;
  iconKey?: string;
  href?: string;
  external?: boolean;
  feature?: string;
};

function isPersona(item: NavItem): item is PersonaItem {
  return item.kind === "persona";
}

function parsePersonaFromHref(href: string | undefined): PersonaKey | null {
  if (!href) return null;
  try {
    const url = new URL(href, "https://tullyelly.com");
    const personaQuery = url.searchParams.get("persona");
    if (isPersonaKey(personaQuery)) return personaQuery;
    const pathname = url.pathname.replace(/^\/+/, "");
    return isPersonaKey(pathname) ? pathname : null;
  } catch {
    return null;
  }
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
  return section.items.flatMap((item) => {
    const key = derivePersonaKeyFromItem(item);
    return key
      ? [
          {
            key,
            label: item.label,
            iconKey: item.iconKey,
            href: item.href,
            external: item.external,
            feature: item.feature,
          },
        ]
      : [];
  });
}

function normalizeHrefPath(href?: string | null): string | null {
  if (!href) return null;
  try {
    return normalizePath(new URL(href, "https://tullyelly.com").pathname);
  } catch {
    return normalizePath(href.split("?")[0] ?? href);
  }
}

function isOverviewLink(item: Pick<AnyLink, "id" | "label" | "featureKey">) {
  return (
    item.id === "overview" ||
    item.label.toLowerCase() === "overview" ||
    Boolean(item.featureKey?.endsWith(".overview"))
  );
}

function isPersonaLandingLink(persona: PersonaItem, link: AnyLink): boolean {
  return normalizeHrefPath(link.href) === `/${persona.persona}`;
}

function buildPersonaNode(
  option: PersonaOption,
  childrenMap: PersonaChildren,
): PersonaItem {
  const children: NavItem[] = (childrenMap[option.key] ?? []).flatMap(
    (item) => {
      if (!item.href) return [];
      const base = {
        id: item.id,
        label: item.label,
        icon: item.iconKey ?? undefined,
        featureKey: item.feature ?? undefined,
        badge: item.badge,
        hotkey: item.hotkey,
      };
      return [
        item.external
          ? ({
              ...base,
              kind: "external",
              href: item.href,
              target: "_blank",
            } as const)
          : ({ ...base, kind: "link", href: item.href } as const),
      ];
    },
  );

  if (
    option.href &&
    normalizeHrefPath(option.href) === `/${option.key}` &&
    !children.some(
      (item) =>
        (item.kind === "link" || item.kind === "external") &&
        (isOverviewLink(item) ||
          normalizeHrefPath(item.href) === normalizeHrefPath(option.href)),
    )
  ) {
    children.unshift(
      option.external
        ? {
            id: "overview",
            label: "Overview",
            icon: option.iconKey,
            featureKey: option.feature,
            kind: "external",
            href: option.href,
            target: "_blank",
          }
        : {
            id: "overview",
            label: "Overview",
            icon: option.iconKey,
            featureKey: option.feature,
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

type PersonaSectionProps = {
  persona: PersonaItem;
  pathname: string;
  onLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    persona: PersonaItem,
    link: AnyLink,
  ): void;
};

function PersonaSection({
  persona,
  pathname,
  onLinkClick,
}: PersonaSectionProps) {
  const links = getPersonaLinks(persona);
  const headingId = `desktop-menu-heading-${persona.persona}`;

  return (
    <section
      aria-labelledby={headingId}
      data-persona-menu={persona.id}
      className="min-w-0 self-start px-2 xl:px-3 2xl:border-l 2xl:border-[color:var(--border-subtle)] 2xl:first:border-l-0"
    >
      <div className="mb-1.5 flex items-center gap-2 px-2">
        <Icon
          name={persona.icon}
          className="size-4 shrink-0 text-[color:var(--blue)]"
        />
        <h2
          id={headingId}
          className="truncate text-sm font-semibold lowercase tracking-wide"
        >
          {persona.label}
        </h2>
      </div>
      <div className="space-y-1">
        {links.map((link) => {
          const external = link.kind === "external";
          const active = isActiveHref(pathname, link.href);
          return (
            <Link
              key={`${persona.id}-${link.id}`}
              href={link.href}
              target={external ? (link.target ?? "_blank") : undefined}
              rel={external ? "noreferrer noopener" : undefined}
              aria-current={active ? "page" : undefined}
              data-testid={getMenuItemTestId(persona, link)}
              data-desktop-menu-link
              onClick={(event) => onLinkClick(event, persona, link)}
              className={cn(
                "group flex min-h-10 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[color:var(--ink)] no-underline transition-colors",
                "hover:bg-[color:var(--surface-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue)]",
                active &&
                  "bg-[color:var(--surface-page)] text-[color:var(--blue-contrast)]",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{link.label}</span>
              {link.badge ? (
                <span className="rounded-full bg-[color:var(--surface-page)] px-2 py-1 text-[10px] uppercase tracking-wide text-[color:var(--blue-contrast)]">
                  {link.badge.text}
                </span>
              ) : null}
              <Icon
                name={external ? "ExternalLink" : "ArrowRight"}
                className="size-3.5 shrink-0 text-[color:var(--blue)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function NavDesktop({
  menu,
  childrenMap,
}: Props): React.ReactNode {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const currentRoute = React.useMemo(() => {
    const search = searchParams?.toString() ?? "";
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);
  const { registerCloseHandler } = useNavController();
  const [open, setOpen] = React.useState(false);
  const menuTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  useNavResetOnRouteChange();

  const personas = React.useMemo(() => {
    const options = extractPersonaOptions(menu);
    if (options.length) {
      return options.map((option) => buildPersonaNode(option, childrenMap));
    }
    const fallback = PERSONA_KEYS.filter(
      (key) => (childrenMap[key] ?? []).length > 0,
    ).map((key) => buildPersonaNode({ key, label: key }, childrenMap));
    if (fallback.length || !TEST_MODE) return fallback;
    return TEST_MENU_ITEMS.filter(isPersona);
  }, [childrenMap, menu]);

  const closeMenu = React.useCallback(() => setOpen(false), []);

  React.useEffect(
    () => registerCloseHandler(closeMenu),
    [closeMenu, registerCloseHandler],
  );

  React.useEffect(() => setOpen(false), [currentRoute]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        analytics.track("menu.desktop.open", {
          persona: menu.persona,
          root: "global",
        });
      }
    },
    [menu.persona],
  );

  const handlePersonaLinkClick = React.useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      persona: PersonaItem,
      link: AnyLink,
    ) => {
      if (link.kind !== "external" && isSameRoute(currentRoute, link.href)) {
        handleSameRouteNoop(event, closeMenu);
        return;
      }
      analytics.track("menu.desktop.click", {
        path: link.href,
        featureKey: link.featureKey ?? null,
        persona: persona.persona,
      });
      closeMenu();
    },
    [closeMenu, currentRoute],
  );

  if (!personas.length) return null;

  const homeActive = isActiveHref(pathname, "/");

  return (
    <nav
      data-testid="nav-desktop"
      aria-label="Primary navigation"
      className="relative z-[var(--z-header)] hidden bg-transparent text-white shadow-sm lg:block"
    >
      <div className="mx-auto flex w-full max-w-[var(--content-max)] items-center gap-3 px-6 py-3 md:px-8 md:pl-[var(--bookmark-offset)] lg:px-10">
        <Link
          href="/"
          data-nav-home
          aria-current={homeActive ? "page" : undefined}
          aria-label="home"
          data-testid="nav-top-home"
          onClick={(event) => {
            if (isSameRoute(currentRoute, "/")) {
              handleSameRouteNoop(event, closeMenu);
            }
          }}
          className={cn(
            "inline-flex h-11 items-center rounded-lg px-3.5 text-[15px] font-semibold lowercase !text-white !no-underline transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            homeActive ? "bg-white/20" : "hover:bg-white/10",
          )}
        >
          home
        </Link>

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              ref={menuTriggerRef}
              type="button"
              data-testid="nav-desktop-menu"
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-3.5 text-[15px] font-semibold text-white transition-colors",
                "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                open && "bg-white/20",
              )}
            >
              <Menu className="size-4" aria-hidden="true" />
              <span>Menu</span>
              <Icon
                name="ChevronDown"
                className={cn(
                  "size-3 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            collisionPadding={16}
            data-testid="nav-desktop-panel"
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              closeMenu();
              queueMicrotask(() => menuTriggerRef.current?.focus());
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation();
              closeMenu();
              queueMicrotask(() => menuTriggerRef.current?.focus());
            }}
            className="max-h-[min(72vh,48rem)] w-[min(96rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[color:var(--border-subtle)] bg-white p-4 text-[color:var(--ink)] shadow-[0_24px_60px_rgba(0,0,0,0.24)] motion-reduce:animate-none"
          >
            <div className="grid items-start gap-x-2 gap-y-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {personas.map((persona) => (
                <PersonaSection
                  key={persona.id}
                  persona={persona}
                  pathname={pathname}
                  onLinkClick={handlePersonaLinkClick}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <DesktopSearchTrigger />
          <HeaderUser />
        </div>
      </div>
    </nav>
  );
}
