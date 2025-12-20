"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavItem, PersonaItem } from "@/types/nav";
import { useHasReducedMotion } from "@/hooks/use-has-reduced-motion";
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
import NestableMenu from "@/app/(components)/menu/NestableMenu";
import { AnyLink, HOME_EMOJI, isActiveHref } from "@/components/nav/menuUtils";
import { handleSameRouteNoop, isSameRoute } from "@/components/nav/sameRoute";
import twemoji from "twemoji";
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

  const AIM_OPEN_DELAY = 110;
  const AIM_CLOSE_DELAY = 160;
  const AIM_BUFFER = 6;
  const prefersReduced = useHasReducedMotion();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const triggerRefs = React.useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  );
  const pointerShields = React.useRef<Map<string, () => boolean>>(new Map());
  const headerRef = React.useRef<HTMLElement | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);
  const twemojiFrameRef = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    if (!navRef.current) return;
    headerRef.current =
      navRef.current.closest("header") ??
      document.getElementById("site-header");
  }, []);

  React.useLayoutEffect(() => {
    setOpenId(null);
  }, []);

  const setPersonaOpen = React.useCallback((id: string, open: boolean) => {
    setOpenId((current) => {
      if (open) {
        return id;
      }
      if (current === id) {
        return null;
      }
      return current;
    });
  }, []);

  const handlePersonaOpenChange = React.useCallback(
    (id: string, open: boolean) => {
      setPersonaOpen(id, open);
    },
    [setPersonaOpen],
  );

  const forceCloseAll = React.useCallback(() => {
    setOpenId(null);
    triggerRefs.current.forEach((node) => {
      node?.blur?.();
    });
  }, []);

  React.useEffect(
    () => registerCloseHandler(forceCloseAll),
    [registerCloseHandler, forceCloseAll],
  );

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
      if (openId) {
        const guard = pointerShields.current.get(openId);
        if (guard?.()) {
          return;
        }
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
  }, [forceCloseAll, isPersonaMenuNode, openId]);

  React.useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    if (twemojiFrameRef.current !== null) {
      window.cancelAnimationFrame(twemojiFrameRef.current);
      twemojiFrameRef.current = null;
    }
    twemojiFrameRef.current = window.requestAnimationFrame(() => {
      twemoji.parse(node, { folder: "svg", ext: ".svg" });
      twemojiFrameRef.current = null;
    });
    return () => {
      if (twemojiFrameRef.current !== null) {
        window.cancelAnimationFrame(twemojiFrameRef.current);
        twemojiFrameRef.current = null;
      }
    };
  }, [personas]);

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
      const slug = id.split(".").pop();
      const trigger = slug
        ? (document.querySelector(
            `[data-testid="nav-top-${slug}"]`,
          ) as HTMLElement | null)
        : null;
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

      setPersonaOpen(id, true);

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
  }, [setPersonaOpen]);

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

  const registerPointerShield = React.useCallback(
    (id: string, guard: (() => boolean) | null) => {
      if (guard) {
        pointerShields.current.set(id, guard);
      } else {
        pointerShields.current.delete(id);
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
      handlePersonaOpenChange(nextId, true);
      focusTrigger(nextId);
    },
    [focusTrigger, handlePersonaOpenChange, personaIds],
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
    },
    [currentRoute, forceCloseAll],
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
        handlePersonaOpenChange(id, true);
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
          handlePersonaOpenChange(id, false);
        }
      }
    },
    [handlePersonaOpenChange, moveFocus, openId],
  );

  if (!personas.length) return null;

  return (
    <nav
      ref={navRef}
      data-testid="nav-desktop"
      data-emoji-scope="nav"
      className="relative z-[var(--z-header)] hidden bg-transparent text-white shadow-sm md:block"
    >
      <div className="mx-auto flex w-full max-w-[var(--content-max)] items-center px-6 py-2 md:px-8 md:pl-[var(--bookmark-offset)] lg:px-10">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-6 overflow-hidden">
          <Link
            href="/"
            data-nav-home
            className="
              inline-flex items-center rounded-md px-3 py-2 text-sm font-medium
              lowercase underline underline-offset-4 decoration-white
              !text-white !opacity-100
              bg-transparent hover:bg-white/10
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              transition-colors
              relative z-10
            "
            aria-current={homeActive ? "page" : undefined}
            aria-label="home"
            data-testid="nav-top-home"
            onClick={(event) => {
              if (isSameRoute(currentRoute, "/")) {
                handleSameRouteNoop(event, forceCloseAll);
              }
            }}
          >
            <span className="flex items-center gap-2">
              <span className="emoji text-lg leading-none" aria-hidden="true">
                {HOME_EMOJI}
              </span>
              <span>home</span>
            </span>
          </Link>
          {personas.map((persona) => (
            <NestableMenu
              key={persona.id}
              persona={persona}
              pathname={pathname ?? ""}
              isOpen={openId === persona.id}
              onOpenChange={handlePersonaOpenChange}
              registerTrigger={registerTrigger}
              registerPointerShield={registerPointerShield}
              focusTrigger={focusTrigger}
              onTriggerKeyDown={handleTriggerKeyDown}
              onLinkClick={handlePersonaLinkClick}
              headerRef={headerRef}
              prefersReducedMotion={prefersReduced}
              aimOpenDelay={AIM_OPEN_DELAY}
              aimCloseDelay={AIM_CLOSE_DELAY}
              aimBuffer={AIM_BUFFER}
            />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-6 pl-6">
          <HeaderUser />
        </div>
      </div>
    </nav>
  );
}
