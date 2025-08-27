# ScrollsTable

TanStack Table powered UI for Shaolin Scrolls releases.

## Columns

1. **Expander** – toggles row details (placeholder).
2. **Release Name** – primary identifier, sortable.
3. **Status** – colored badge showing release status.
4. **Type** – colored pill for patch/minor/hotfix.
5. **SemVer** – monospace semantic version, sortable.
6. **Actions** – three-dot menu for row actions.

## Extending

Add new fields to `Release` in `ScrollsTable.tsx` and append a `ColumnDef`
to the `columns` array. Columns are memoized; update dependencies
accordingly.
