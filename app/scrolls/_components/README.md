# ScrollsTable

TanStack Table powered UI for Shaolin Scrolls releases.

## Columns

1. **Expander** – toggles row details (placeholder).
2. **Release Name** – primary identifier, sortable, truncates long names.
3. **Status** – colored badge showing release status.
4. **Type** – colored pill for patch/minor/hotfix.
5. **SemVer** – monospace semantic version, sortable.
6. **Actions** – three-dot menu for row actions.

## Extending

Columns are defined with explicit `size`/`minSize` values and optional
`meta.headerClassName` and `meta.cellClassName` for Tailwind classes.
To add a column:

1. Extend the `Release` type in `ScrollsTable.tsx`.
2. Append a `ColumnDef` to the `columns` array with width settings.
3. Provide `meta` class names to align header and cells.
