# ScrollsTable

TanStack Table powered UI for Shaolin Scrolls releases with fixed column widths and a sticky header.

## Columns

1. **Release Name** – primary identifier, sortable, truncates long names.
2. **Status** – colored badge showing release status.
3. **Type** – colored pill for patch/minor/hotfix.
4. **SemVer** – monospace semantic version, sortable.

## Extending

Columns are defined with explicit `size`/`minSize` values and optional
`meta.headerClassName` and `meta.cellClassName` for Tailwind classes.
To add a column:

1. Extend the `Release` type in `ScrollsTable.tsx`.
2. Append a `ColumnDef` to the `columns` array with width settings.
3. Provide `meta` class names to align header and cells.

The component also handles loading and empty states. Pass `isLoading` to render skeleton rows.
