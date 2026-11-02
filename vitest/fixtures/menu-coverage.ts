import type { MenuNodeRow } from "@/lib/menu/dbTypes";
import type { PersonaKey } from "@/lib/menu/types";

// Representative post-094 data, independent of either connected database.
const inventory: Record<PersonaKey, [string, string][]> = {
  shaolin: [
    ["chronicles", "/shaolin"],
    ["Chronicle tags", "/shaolin/tags"],
  ],
  mark2: [
    ["blueprint", "/mark2"],
    ["Shaolin Scrolls", "/mark2/shaolin-scrolls"],
    ["Releases", "/mark2/releases"],
  ],
  cardattack: [
    ["vault", "/cardattack"],
    ["Homies", "/cardattack/homies"],
    ["Clans", "/cardattack/clans"],
    ["Categories", "/cardattack/categories"],
    ["Trades", "/cardattack/tcdb-trades"],
    ["Trade Partners", "/cardattack/tcdb-trade-partners"],
    ["Hall of Fame", "/cardattack/hof"],
    ["Set Collector", "/cardattack/set-collector"],
    ["Local Card Shops", "/cardattack/lcs"],
    ["USPS", "/cardattack/usps"],
    ["Releases", "/cardattack/releases"],
  ],
  unclejimmy: [
    ["circus", "/unclejimmy"],
    ["squad", "/unclejimmy/squad"],
    ["cute stamps", "/unclejimmy/cute-stamps"],
    ["hug ball", "/unclejimmy/hug-ball"],
    ["Fam", "/unclejimmy/fam"],
    ["Squads", "/unclejimmy/squads"],
    ["Volleyball Tournaments", "/unclejimmy/squad/volleyball"],
    ["Bricks: LEGO", "/unclejimmy/bricks"],
    ["Call A Save Point", "/unclejimmy/call-a-save-point"],
    ["Golden Age", "/unclejimmy/golden-age"],
    ["Table Schema", "/unclejimmy/table-schema"],
    ["Releases", "/unclejimmy/releases"],
  ],
  theabbott: [
    ["cipher", "/theabbott"],
    ["The Crates", "/theabbott/crates"],
    ["Homies", "/theabbott/homies"],
    ["Clans", "/theabbott/clans"],
    ["HEELS HAVE EYES", "/theabbott/heels-have-eyes"],
    ["roadwork rappin", "/theabbott/roadwork-rappin"],
    ["Releases", "/theabbott/releases"],
  ],
  tullyelly: [
    ["forge", "/tullyelly"],
    ["ruins", "/tullyelly/ruins"],
    ["github", "https://github.com/tullyelly/tullyelly.com"],
    ["Traffic statistics", "/stats"],
    ["Flowers", "/credits"],
    ["Releases", "/tullyelly/releases"],
  ],
};
export const publicDestinations = Object.values(inventory)
  .flat()
  .map(([, href]) => href);
export function menuCoverageRows(): MenuNodeRow[] {
  let id = 1;
  const rows: MenuNodeRow[] = [];
  for (const [persona, links] of Object.entries(inventory) as [
    PersonaKey,
    [string, string][],
  ][]) {
    const root: MenuNodeRow = {
      id: id++,
      parent_id: null,
      persona,
      kind: "persona",
      label: persona,
      href: null,
      target: null,
      icon: null,
      order_index: rows.length,
      feature_key: null,
      hidden: false,
      published: true,
      meta: {},
    };
    rows.push(root);
    for (const [order, [label, href]] of links.entries()) {
      rows.push({
        ...root,
        id: id++,
        parent_id: root.id,
        kind: "link",
        label,
        href,
        order_index: order,
        target: href.startsWith("https:") ? "_blank" : null,
      });
    }
    if (persona === "mark2")
      rows.push({
        ...root,
        id: id++,
        parent_id: root.id,
        kind: "link",
        label: "admin",
        href: "/mark2/admin",
        feature_key: "menu.mark2.admin",
        meta: { requires: ["admin.app.view", "admin.membership.manage"] },
      });
  }
  return rows;
}
