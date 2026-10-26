import { getFallbackPrimary } from "@/lib/menu/fallback";
import { buildMenuIndex } from "@/lib/menu.index";
import { getBreadcrumbs } from "@/lib/menu.breadcrumbs";
import type { NavItem } from "@/types/nav";
it("adds Categories to the shared fallback used by all navigation consumers", () => {
  const items = getFallbackPrimary("cardattack");
  expect(
    items.filter((item) => item.href === "/cardattack/categories"),
  ).toEqual([
    expect.objectContaining({
      label: "Categories",
      feature: "menu.cardattack.categories",
    }),
  ]);
  expect(items.some((item) => item.href === "/cardattack/homies")).toBe(true);
  expect(items.some((item) => item.href === "/cardattack/clans")).toBe(true);
});
it("resolves category breadcrumbs through the ordinary menu index", () => {
  const tree: NavItem[] = [
    {
      id: "cardattack",
      kind: "persona",
      persona: "cardattack",
      label: "cardattack",
      children: [
        {
          id: "categories",
          kind: "link",
          label: "Categories",
          href: "/cardattack/categories",
        },
      ],
    },
  ];
  expect(
    getBreadcrumbs("/cardattack/categories/basketball", buildMenuIndex(tree)),
  ).toEqual([
    { label: "Categories", href: "/cardattack/categories" },
    { label: "Basketball", href: "/cardattack/categories/basketball" },
  ]);
});
