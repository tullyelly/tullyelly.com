# Shout Out Inventory Notes

Current places where “shout” style asides appear without a dedicated component:

- `components/ChroniclesSection.tsx` – closing line “shouts to the chronicles wiki Raistlin Majere” styled with `text-muted-foreground`.
- `components/ShaolinScrollsSection.tsx` – closing line “shouts to Postgres, Neon & DataGrip…” also using `text-muted-foreground`.
- `app/heels-have-eyes/page.tsx` – inline “Shouts to Denny LaFlare.” in body copy.
- `components/Callout.tsx` – ad‑hoc `<aside role="note" class="callout">` with no shared styling.

Existing typography/color tokens related to muted or accent text:

- Tailwind class `text-muted-foreground` mapped to `--muted-foreground`.
- Global `.muted` helper in `app/globals.css` using a 60% mix of `--text-primary` and `--surface-page`.
- `.bucks-accent` utility for brand accent color (`--blue`).

These usages should consolidate on the upcoming `ShoutOut` component and shared CSS variables `--so-accent` and `--so-bg`.
