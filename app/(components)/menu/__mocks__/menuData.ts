import type { PersonaItem } from "@/types/nav";

export const mockPersonaMenus: PersonaItem[] = [
  {
    id: "persona.mark2",
    kind: "persona",
    persona: "mark2",
    label: "mark2",
    icon: "Brain",
    children: [
      {
        id: "mark2-overview",
        kind: "link",
        label: "Overview",
        href: "/mark2/overview",
      },
      {
        id: "mark2-scrolls",
        kind: "link",
        label: "Shaolin Scrolls",
        href: "/mark2/scrolls",
        featureKey: "menu.mark2.scrolls",
      },
      {
        id: "mark2-labs",
        kind: "link",
        label: "Labs",
        href: "/mark2/labs",
        badge: { text: "New" },
      },
    ],
  },
  {
    id: "persona.cardattack",
    kind: "persona",
    persona: "cardattack",
    label: "cardattack",
    icon: "GalleryHorizontalEnd",
    children: [
      {
        id: "cardattack-rankings",
        kind: "link",
        label: "Rankings",
        href: "/cardattack/rankings",
      },
      {
        id: "cardattack-sets",
        kind: "link",
        label: "Sets",
        href: "/cardattack/sets",
      },
      {
        id: "cardattack-tcdb",
        kind: "external",
        label: "TCDB",
        href: "https://www.tcdb.com/",
        target: "_blank",
      },
    ],
  },
];
