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

The command search is non-modal so header and background controls remain
interactive. Radix mounts its content only while open, handles Escape and outside
dismissal, and loops Tab navigation. Its open autofocus targets the search input;
its close autofocus callback returns to the captured opener, retains focus on an
outside control used to dismiss it, or falls back to the connected search button
and then main content if navigation removed the opener. Closed command content
must be unmounted rather than hidden around a focused descendant.

Recharts charts with reserved pixel or calculated heights pass that same numeric
height to ResponsiveContainer while keeping responsive width. The card-count
sparklines use Recharts' responsive LineChart measurement with 100% width and
height inside their h-24 wrappers; their height follows the root font size.
Do not guess positive initial dimensions or add a second resize observer around
Recharts. Real chart layout and warning coverage lives in
[chart-sizing.spec.ts](../tests/browser/chart-sizing.spec.ts).
