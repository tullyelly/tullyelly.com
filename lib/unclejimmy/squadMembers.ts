export type SquadMember = {
  slug: string;
  label: string;
  blurb: string;
  kind?: "person" | "team";
  href?: string;
};

export const squadMembers: SquadMember[] = [
  {
    slug: "nikkigirl",
    label: "nikkigirl",
    blurb: "Placeholder blurb for nikkigirl inside the 🎙unclejimmy squad.",
    kind: "person",
    href: "/shaolin/tags/nikkigirl",
  },
  {
    slug: "bonnibel",
    label: "bonnibel",
    blurb: "Placeholder blurb for bonnibel; more details coming soon.",
    kind: "person",
  },
  {
    slug: "lulu",
    label: "lulu",
    blurb: "Placeholder blurb for lulu as part of the core squad energy.",
    kind: "person",
    href: "/shaolin/tags/lulu",
  },
  {
    slug: "jeff-meff",
    label: "jeff-meff",
    blurb: "Placeholder blurb for jeff-meff; tales will land here later.",
    kind: "person",
    href: "/shaolin/tags/jeff-meff",
  },
  {
    slug: "eeeeeeeemma",
    label: "eeeeeeeemma",
    blurb: "Placeholder blurb for eeeeeeeemma with updates to follow.",
    kind: "person",
    href: "/shaolin/tags/eeeeeeeemma",
  },
];

export function getSquadMember(slug: string): SquadMember | undefined {
  const needle = slug.trim().toLowerCase();
  return squadMembers.find((member) => member.slug.toLowerCase() === needle);
}
