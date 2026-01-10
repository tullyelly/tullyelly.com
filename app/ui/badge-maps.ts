/** Global variants used across the app */
export const BADGE_VARIANTS = {
  planned: "bg-[#0077C0] text-white ring-[#0077C0]/40",
  released: "bg-[#00471B] text-white ring-[#00471B]/40",
  hotfix: "bg-[#C41E3A] text-white ring-[#C41E3A]/40",
  patch: "bg-[#C41E3A] text-white ring-[#C41E3A]/40",
  archived: "bg-[#EEE1C6] text-[#1A1A1A] ring-[#1A1A1A]/20",
  minor: "bg-[#00471B] text-white ring-[#00471B]/40",
  major: "bg-[#EEE1C6] text-[#1A1A1A] ring-[#1A1A1A]/20",
  chore: "bg-[#702F8A] text-white ring-[#702F8A]/40",
  tcdb: "bg-[#B65A36] text-[#F2E5D6] ring-[#B65A36]/40",
  wax: "chrome-foil-bg bg-[var(--tc-chrome-lo)] text-[var(--ink)] ring-[var(--tc-chrome-shadow)]",

  // alias to planned
  classic: "bg-[#0077C0] text-white ring-[#0077C0]/40",
  year: "bg-brand-bucksGreen text-brand-creamCityCream ring-brand-bucksGreen/40",
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export const getBadgeClass = (variant: BadgeVariant) =>
  BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.archived;
