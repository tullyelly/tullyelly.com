# Shared UI conventions

Inspect neighboring routes and shared primitives before adding abstractions.
Reuse components/ui shells, SectionHeader, DataToolbar, TableSearch, TablePager,
and responsive data cards where their existing contracts fit. Keep search,
filters, pagination, and row actions with their semantic owner.

Dialogs use Radix through existing wrappers:
[DialogPanel](../components/ui/DialogPanel.tsx),
[Modal](../components/ui/Modal.tsx), and
[dialog](../components/ui/dialog.tsx). Preserve title/description, focus return,
close behavior, and closed-state pointer events. Test the interaction changed,
including keyboard behavior; include screenshots in UI PRs.

Tailwind and [app/globals.css](../app/globals.css) own design tokens; do not add
inline hex colors or change palettes/personas. Use existing cn utilities.
Server authorization remains mandatory even when UI hides actions.
Follow [hydration](hydration.md) and [validation](validation.md) for deterministic
rendering and the appropriate Jest, Vitest, and browser checks.
