import * as React from "react";

import { cn } from "@/lib/utils";

type TableVariant = "default" | "bucks";

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  variant?: TableVariant; // controls outer frame styling
  showOnMobile?: boolean;
  themeStyle?: React.CSSProperties;
  frameClassName?: string;
  frameStyle?: React.CSSProperties;
};

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
  showOnMobile = false,
  themeStyle,
  frameClassName,
  frameStyle,
  ...rest
}: TableProps) {
  const frameClass =
    variant === "bucks"
      ? "overflow-x-auto overflow-hidden rounded-2xl border-2 border-[color:var(--table-frame-border)] shadow-sm ring-0"
      : "overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5";
  const displayClass = showOnMobile ? "block" : "hidden md:block";
  const resolvedFrameStyle = React.useMemo(
    () => ({
      ...TABLE_THEME_STYLES[variant],
      ...(themeStyle ?? {}),
      ...(frameStyle ?? {}),
    }),
    [frameStyle, themeStyle, variant],
  );

  return (
    <div className={displayClass} suppressHydrationWarning>
      <div
        className={cn(frameClass, frameClassName)}
        style={resolvedFrameStyle}
      >
        <table
          className={cn(
            "zebra-desktop w-full table-fixed border-collapse text-sm leading-6",
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
      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-[color:var(--table-head-text)]">
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
    <tbody className={cn("[&>tr>td]:px-4 [&>tr>td]:py-3 text-ink", className)}>
      {children}
    </tbody>
  );
}
