import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./breadcrumb.module.css";

export type Crumb = {
  label: string;
  href?: string;
  ariaLabel?: string;
  icon?: ReactNode;
};

type BreadcrumbProps = {
  items: Crumb[];
  className?: string;
  separator?: ReactNode;
  prefix?: ReactNode;
  maxItems?: number;
};

const DEFAULT_SEPARATOR = (
  <span aria-hidden="true" className={styles.separator}>
    {" / "}
  </span>
);

const COLLAPSE_GLYPH = "…";

function collapseCrumbs(items: Crumb[], maxItems?: number): Crumb[] {
  if (!maxItems || items.length <= maxItems) {
    return items;
  }
  if (maxItems < 3) {
    return items;
  }

  const head = items[0];
  const tailCount = Math.max(1, maxItems - 2);
  const tail = items.slice(-tailCount);

  return [
    head,
    {
      label: COLLAPSE_GLYPH,
      ariaLabel: "Collapsed breadcrumbs",
    },
    ...tail,
  ];
}

export function humanizeLabel(input: string): string {
  if (!input) return "";
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }
  const normalized = decoded.replace(/[-_]+/g, " ").trim().toLowerCase();
  if (!normalized) return "";
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Breadcrumb({
  items,
  className,
  prefix,
  separator = DEFAULT_SEPARATOR,
  maxItems,
}: BreadcrumbProps) {
  const baseItems = Array.isArray(items) ? items : [];
  const normalizedItems = collapseCrumbs(baseItems, maxItems);
  const lastIndex = normalizedItems.length - 1;
  const hasItems = normalizedItems.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <nav
      data-testid="breadcrumb"
      aria-label="Breadcrumb"
      className={cn(styles.root, "flex items-center gap-2 text-sm", className)}
    >
      {prefix ? <div className={styles.prefix}>{prefix}</div> : null}
      <ol className={styles.container}>
        {normalizedItems.map((item, index) => {
          const isLast = index === lastIndex;
          const key = item.href ?? `${item.label}-${index}`;
          const title = item.ariaLabel ?? item.label;
          return (
            <li className={styles.item} key={key}>
              {isLast || !item.href || item.label === COLLAPSE_GLYPH ? (
                <span
                  className={cn(styles.current, "uppercase")}
                  aria-current={isLast ? "page" : undefined}
                  title={title}
                >
                  {item.icon ? (
                    <span className={styles.icon} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <Link
                  className={cn(
                    styles.link,
                    "font-medium text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link rounded-sm",
                  )}
                  href={item.href}
                  title={title}
                  aria-label={item.ariaLabel ?? item.label}
                >
                  {item.icon ? (
                    <span className={styles.icon} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
              {index < lastIndex ? separator : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
