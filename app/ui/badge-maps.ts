const v = (k: string) =>
  `bg-[var(--badge-${k}-bg)] text-[var(--badge-${k}-fg)] ring-[var(--badge-${k}-ring)]`;

/** Global variants used across the app */
export const BADGE_VARIANTS = {
  planned:  "bg-[#0077C0] text-white ring-[#0077C0]/40",
  released: "bg-[#00471B] text-white ring-[#00471B]/40",
  hotfix:   "bg-[#C41E3A] text-white ring-[#C41E3A]/40",
  archived: "bg-[#EEE1C6] text-[#1A1A1A] ring-[#1A1A1A]/20",
  minor:    "bg-[#00471B] text-white ring-[#00471B]/40",
  major:    "bg-[#EEE1C6] text-[#1A1A1A] ring-[#1A1A1A]/20",

  // new global special variant
  classic:  v("classic"),
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export const getBadgeClass = (variant: BadgeVariant) =>
  BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.archived;

