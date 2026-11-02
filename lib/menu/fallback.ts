import type { MenuItem, MenuPayload, MenuSection, PersonaKey } from "./types";

export const PERSONA_SWITCHER_ITEMS: MenuItem[] = [
  {
    id: "p-mark2",
    label: "mark2",
    href: "/?persona=mark2",
    iconKey: "Brain",
  },
  {
    id: "p-shaolin",
    label: "shaolin",
    href: "/?persona=shaolin",
    iconKey: "ScrollText",
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
  shaolin: [
    {
      id: "chronicles",
      label: "Chronicles",
      href: "/shaolin",
      iconKey: "ScrollText",
    },
    {
      id: "/shaolin/tags",
      label: "Chronicle tags",
      href: "/shaolin/tags",
    },
  ],
  mark2: [
    {
      id: "overview",
      label: "Overview",
      href: "/mark2",
      iconKey: "Brain",
    },
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
    },
    {
      id: "/mark2/releases",
      label: "Releases",
      href: "/mark2/releases",
    },
  ],
  tullyelly: [
    {
      id: "overview",
      label: "Overview",
      href: "/tullyelly",
      iconKey: "Code2",
    },
    {
      id: "/stats",
      label: "Traffic statistics",
      href: "/stats",
    },
    {
      id: "/credits",
      label: "Flowers",
      href: "/credits",
    },
    {
      id: "/tullyelly/releases",
      label: "Releases",
      href: "/tullyelly/releases",
    },
    {
      id: "/tullyelly/ruins",
      label: "ruins",
      href: "/tullyelly/ruins",
    },
    {
      id: "https://github.com/tullyelly/tullyelly.com",
      label: "github",
      href: "https://github.com/tullyelly/tullyelly.com",
      external: true,
    },
  ],
  unclejimmy: [
    {
      id: "overview",
      label: "Overview",
      href: "/unclejimmy",
      iconKey: "Smile",
    },
    {
      id: "fam",
      label: "Fam",
      href: "/unclejimmy/fam",
      iconKey: "Users",
    },
    {
      id: "squads",
      label: "Squads",
      href: "/unclejimmy/squads",
      iconKey: "Users",
    },
    {
      id: "cute-stamps",
      label: "cute stamps",
      href: "/unclejimmy/cute-stamps",
      iconKey: "Heart",
    },
    {
      id: "/unclejimmy/squad/volleyball",
      label: "Volleyball Tournaments",
      href: "/unclejimmy/squad/volleyball",
    },
    {
      id: "/unclejimmy/bricks",
      label: "Bricks: LEGO",
      href: "/unclejimmy/bricks",
    },
    {
      id: "/unclejimmy/call-a-save-point",
      label: "Call A Save Point",
      href: "/unclejimmy/call-a-save-point",
    },
    {
      id: "/unclejimmy/golden-age",
      label: "Golden Age",
      href: "/unclejimmy/golden-age",
    },
    {
      id: "/unclejimmy/table-schema",
      label: "Table Schema",
      href: "/unclejimmy/table-schema",
    },
    {
      id: "/unclejimmy/releases",
      label: "Releases",
      href: "/unclejimmy/releases",
    },
    {
      id: "/unclejimmy/squad",
      label: "squad",
      href: "/unclejimmy/squad",
    },
    {
      id: "/unclejimmy/hug-ball",
      label: "hug ball",
      href: "/unclejimmy/hug-ball",
    },
  ],
  cardattack: [
    {
      id: "overview",
      label: "Overview",
      href: "/cardattack",
      iconKey: "GalleryHorizontalEnd",
    },
    {
      id: "homies",
      label: "Homies",
      href: "/cardattack/homies",
      iconKey: "Trophy",
    },
    {
      id: "clans",
      label: "Clans",
      href: "/cardattack/clans",
      iconKey: "Users",
    },
    {
      id: "categories",
      label: "Categories",
      href: "/cardattack/categories",
      iconKey: "Archive",
    },
    {
      id: "tcdb-trades",
      label: "Trades",
      href: "/cardattack/tcdb-trades",
      iconKey: "ArrowLeftRight",
    },
    {
      id: "tcdb-trade-partners",
      label: "Trade Partners",
      href: "/cardattack/tcdb-trade-partners",
      iconKey: "Users",
    },
    {
      id: "hall-of-fame",
      label: "Hall of Fame",
      href: "/cardattack/hof",
      iconKey: "Trophy",
    },
    {
      id: "set-collector",
      label: "Set Collector",
      href: "/cardattack/set-collector",
      iconKey: "Archive",
    },
    {
      id: "/cardattack/lcs",
      label: "Local Card Shops",
      href: "/cardattack/lcs",
    },
    {
      id: "/cardattack/usps",
      label: "USPS",
      href: "/cardattack/usps",
    },
    {
      id: "/cardattack/releases",
      label: "Releases",
      href: "/cardattack/releases",
    },
  ],
  theabbott: [
    {
      id: "overview",
      label: "Overview",
      href: "/theabbott",
      iconKey: "Feather",
    },
    {
      id: "crates",
      label: "The Crates",
      href: "/theabbott/crates",
      iconKey: "Archive",
    },
    {
      id: "homies",
      label: "Homies",
      href: "/theabbott/homies",
      iconKey: "Users",
    },
    {
      id: "clans",
      label: "Clans",
      href: "/theabbott/clans",
      iconKey: "Users",
    },
    {
      id: "heels-have-eyes",
      label: "heels have eyes",
      href: "/theabbott/heels-have-eyes",
      iconKey: "Eye",
    },
    {
      id: "roadwork-rappin",
      label: "roadwork rappin",
      href: "/theabbott/roadwork-rappin",
      iconKey: "Music4",
    },
    {
      id: "/theabbott/releases",
      label: "Releases",
      href: "/theabbott/releases",
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
