import type { MenuItem, MenuPayload, MenuSection, PersonaKey } from "./types";

export const PERSONA_SWITCHER_ITEMS: MenuItem[] = [
  {
    id: "p-mark2",
    label: "mark2",
    href: "/?persona=mark2",
    iconKey: "Brain",
  },
  {
    id: "p-tullyelly",
    label: "tullyelly",
    href: "/?persona=tullyelly",
    iconKey: "Code2",
  },
  {
    id: "p-unclejimmy",
    label: "unclejimmy",
    href: "/?persona=unclejimmy",
    iconKey: "Smile",
  },
  {
    id: "p-cardattack",
    label: "cardattack",
    href: "/?persona=cardattack",
    iconKey: "GalleryHorizontalEnd",
  },
  {
    id: "p-theabbott",
    label: "theabbott",
    href: "/?persona=theabbott",
    iconKey: "Feather",
  },
];

export const UTILITIES_ITEMS: MenuItem[] = [
  {
    id: "utility-search",
    label: "Search",
    iconKey: "Search",
  },
];

const FALLBACK_PRIMARY: Record<PersonaKey, MenuItem[]> = {
  mark2: [
    {
      id: "admin",
      label: "Admin",
      href: "/mark2/admin",
      iconKey: "Settings",
      feature: "menu.mark2.admin",
    },
    {
      id: "scrolls",
      label: "Shaolin Scrolls",
      href: "/mark2/shaolin-scrolls",
      iconKey: "ScrollText",
      feature: "menu.mark2.scrolls",
    },
    {
      id: "system-health",
      label: "System Health",
      href: "/system/health",
      iconKey: "Activity",
      feature: "menu.mark2.system.health",
    },
    {
      id: "about-personas",
      label: "About the Personas",
      href: "/mark2/about-personas",
      iconKey: "Users",
      feature: "menu.mark2.personas.about",
    },
  ],
  tullyelly: [
    {
      id: "overview",
      label: "Overview",
      href: "/tullyelly",
      iconKey: "Code2",
      feature: "menu.tullyelly.overview",
    },
    {
      id: "docs",
      label: "Docs",
      href: "/docs",
      iconKey: "BookOpen",
      feature: "menu.tullyelly.docs",
    },
  ],
  unclejimmy: [
    {
      id: "overview",
      label: "Overview",
      href: "/unclejimmy",
      iconKey: "Smile",
      feature: "menu.unclejimmy.overview",
    },
    {
      id: "cute-cards",
      label: "Cute Cards",
      href: "/unclejimmy/cute-cards",
      iconKey: "Heart",
      feature: "menu.unclejimmy.cute",
    },
  ],
  cardattack: [
    {
      id: "overview",
      label: "Overview",
      href: "/cardattack",
      iconKey: "GalleryHorizontalEnd",
      feature: "menu.cardattack.overview",
    },
    {
      id: "tcdb-home",
      label: "TCDB Home",
      href: "/tcdb",
      iconKey: "House",
      feature: "menu.cardattack.tcdb.home",
    },
    {
      id: "tcdb-rankings",
      label: "Rankings",
      href: "/tcdb-rankings",
      iconKey: "Trophy",
      feature: "menu.cardattack.tcdb.rankings",
    },
  ],
  theabbott: [
    {
      id: "overview",
      label: "Overview",
      href: "/theabbott",
      iconKey: "Feather",
      feature: "menu.theabbott.overview",
    },
    {
      id: "heels-have-eyes",
      label: "heels have eyes",
      href: "/theabbott/heels-have-eyes",
      iconKey: "Eye",
      feature: "menu.theabbott.hhe",
    },
    {
      id: "roadwork-rappin",
      label: "roadwork rappin",
      href: "/theabbott/roadwork-rappin",
      iconKey: "Music4",
      feature: "menu.theabbott.roadwork",
    },
  ],
};

function cloneItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({ ...item }));
}

export function buildBaseSections(primaryItems: MenuItem[]): MenuSection[] {
  const sections: MenuSection[] = [
    {
      id: "primary",
      title: "Primary",
      items: cloneItems(primaryItems),
    },
    {
      id: "personas",
      title: "By alter ego",
      items: cloneItems(PERSONA_SWITCHER_ITEMS),
    },
    {
      id: "utilities",
      title: "Utilities",
      items: cloneItems(UTILITIES_ITEMS),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}

export function getFallbackPrimary(persona: PersonaKey): MenuItem[] {
  return cloneItems(FALLBACK_PRIMARY[persona] ?? []);
}

export function buildMenuFromPrimary(
  persona: PersonaKey,
  primary: MenuItem[],
): MenuPayload {
  return {
    persona,
    sections: buildBaseSections(primary),
  };
}

export function getFallbackMenu(persona: PersonaKey): MenuPayload {
  return buildMenuFromPrimary(persona, getFallbackPrimary(persona));
}
