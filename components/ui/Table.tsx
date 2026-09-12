import * as React from "react";

import { cn } from "@/lib/utils";

type TableVariant = "default" | "bucks";
type TableLayout = "auto" | "fixed";
type TableDensity = "comfortable" | "compact";

export type TableColumnIntent =
  | "default"
  | "compact"
  | "numeric"
  | "date"
  | "status"
  | "identifier"
  | "name"
  | "grow"
  | "descriptive"
  | "nowrap";

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  variant?: TableVariant; // controls outer frame styling
  layout?: TableLayout;
  density?: TableDensity;
  showOnMobile?: boolean;
  themeStyle?: React.CSSProperties;
  frameClassName?: string;
  frameStyle?: React.CSSProperties;
};

const TABLE_DENSITY_STYLES: Record<TableDensity, React.CSSProperties> = {
  comfortable: {
    ["--table-cell-x" as string]: "1rem",
    ["--table-cell-y" as string]: "0.75rem",
  },
  compact: {
    ["--table-cell-x" as string]: "0.75rem",
    ["--table-cell-y" as string]: "0.5rem",
  },
};

const TABLE_COLUMN_CLASSES: Record<TableColumnIntent, string> = {
  default: "",
  compact: "w-px whitespace-nowrap",
  numeric: "w-px whitespace-nowrap tabular-nums",
  date: "w-px whitespace-nowrap tabular-nums",
  status: "w-px whitespace-nowrap",
  identifier: "w-px whitespace-nowrap tabular-nums",
  name: "w-full min-w-[12rem]",
  grow: "w-full min-w-[12rem]",
  descriptive: "min-w-[16rem] whitespace-normal",
  nowrap: "whitespace-nowrap",
};

export function getTableColumnClassName(intent: TableColumnIntent = "default") {
  return TABLE_COLUMN_CLASSES[intent];
}

const DEFAULT_TABLE_THEME_STYLE: React.CSSProperties = {
  ["--table-head-background" as string]: "var(--white)",
  ["--table-head-text" as string]: "rgba(17, 24, 39, 0.8)",
  ["--table-head-border" as string]: "rgba(0, 0, 0, 0.1)",
  ["--table-row-even-bg" as string]: "var(--cream)",
  ["--table-row-odd-bg" as string]: "var(--white)",
  ["--table-row-hover-filter" as string]: "brightness(0.98)",
  ["--table-row-divider" as string]: "rgba(0, 0, 0, 0.05)",
};

const TABLE_THEME_STYLES: Record<TableVariant, React.CSSProperties> = {
  default: DEFAULT_TABLE_THEME_STYLE,
  bucks: {
    ...DEFAULT_TABLE_THEME_STYLE,
    ["--table-frame-border" as string]: "var(--green)",
    ["--table-head-background" as string]: "var(--green)",
    ["--table-head-text" as string]: "var(--white)",
  },
};

export function Table({
  className,
  children,
  variant = "default",
  layout = "auto",
  density = "comfortable",
  showOnMobile = false,
  themeStyle,
  frameClassName,
  frameStyle,
  ...rest
}: TableProps) {
  const frameClass =
    variant === "bucks"
      ? "overflow-x-auto overflow-y-hidden rounded-2xl border-2 border-[color:var(--table-frame-border)] shadow-sm ring-0"
      : "overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5";
  const displayClass = showOnMobile ? "block" : "hidden md:block";
  const resolvedFrameStyle = React.useMemo(
    () => ({
      ...TABLE_THEME_STYLES[variant],
      ...TABLE_DENSITY_STYLES[density],
      ...(themeStyle ?? {}),
      ...(frameStyle ?? {}),
    }),
    [density, frameStyle, themeStyle, variant],
  );

  return (
    <div className={displayClass} suppressHydrationWarning>
      <div
        className={cn(frameClass, frameClassName)}
        style={resolvedFrameStyle}
      >
        <table
          className={cn(
            "zebra-desktop min-w-full border-collapse text-sm leading-6",
            layout === "fixed" ? "table-fixed" : "table-auto",
            className,
          )}
          {...rest}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

type THeadProps = {
  children: React.ReactNode;
  variant?: TableVariant;
  className?: string;
};

export function THead({
  children,
  variant = "default",
  className,
}: THeadProps) {
  return (
    <thead
      data-table-variant={variant}
      className={cn(
        "border-b border-[color:var(--table-head-border)] [background:var(--table-head-background)]",
        className,
      )}
    >
      <tr className="[&>th]:px-[var(--table-cell-x)] [&>th]:py-[var(--table-cell-y)] [&>th]:text-left [&>th]:font-semibold [&>th]:text-[color:var(--table-head-text)]">
        {children}
      </tr>
    </thead>
  );
}

export function TBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tbody
      className={cn(
        "text-ink [&>tr>td]:px-[var(--table-cell-x)] [&>tr>td]:py-[var(--table-cell-y)] [&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-[color:var(--table-row-divider)]",
        className,
      )}
    >
      {children}
    </tbody>
  );
}

type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  intent?: TableColumnIntent;
};

export function TableHeaderCell({
  intent = "default",
  className,
  scope = "col",
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(getTableColumnClassName(intent), className)}
      {...rest}
    />
  );
}

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  intent?: TableColumnIntent;
};

export function TableCell({
  intent = "default",
  className,
  ...rest
}: TableCellProps) {
  return (
    <td className={cn(getTableColumnClassName(intent), className)} {...rest} />
  );
}

export function TableEmptyRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn("!py-8 text-center text-sm text-ink/70", className)}
      >
        {children}
      </td>
    </tr>
  );
}
