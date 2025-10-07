import type { NavItem } from "@/types/nav";

export const TEST_MENU_ITEMS: NavItem[] = [
  {
    id: "persona.mark2",
    kind: "persona",
    persona: "mark2",
    label: "mark2",
    icon: "Brain",
    children: [
      {
        id: "mark2-scrolls",
        kind: "link",
        label: "Shaolin Scrolls",
        href: "/menu-test/target",
        featureKey: "menu.mark2.scrolls",
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
        label: "TCDB Rankings",
        href: "/menu-test/target",
        featureKey: "menu.cardattack.tcdb.rankings",
      },
      {
        id: "cardattack-home",
        kind: "link",
        label: "TCDB Home",
        href: "/menu-test/target",
        featureKey: "menu.cardattack.tcdb.home",
      },
    ],
  },
];
