# Shaolin Scrolls UI

Shared client components for the Shaolin Scrolls index. `lib/scrolls` exposes the canonical
`ReleaseRow` shape used by both the desktop table (`components/scrolls/ReleasesTable`) and the
mobile cards (`components/scrolls/ReleaseCards`).

## Columns

1. **ID** – numeric identifier linking to the detail dialog/page.
2. **Release Name** – primary label with truncation for long text.
3. **Status** – badge mapped via `getBadgeClass`.
4. **Type** – badge for minor/patch/hotfix.
5. **Release Date** – formatted with `components/scrolls/formatReleaseDate`.

Filters, pagination, and search are wired through `ScrollsPageClient`, which keeps the table and
cards in sync with URL query params.
