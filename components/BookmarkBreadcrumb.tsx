import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./BookmarkBreadcrumb.module.css";

export type Crumb = {
  label: string;
  href?: string;
};

export interface BookmarkBreadcrumbProps {
  items: Crumb[];
  className?: string;
  sticky?: boolean;
  nudgeY?: string;
}

export function toTitle(input: string): string {
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

export default function BookmarkBreadcrumb({
  items,
  className,
  sticky = false,
  nudgeY,
}: BookmarkBreadcrumbProps) {
  if (!items || items.length <= 1) {
    return null;
  }

  const lastIndex = items.length - 1;
  const style = nudgeY
    ? ({ "--bbg-nudge-y": nudgeY } as CSSProperties)
    : undefined;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(styles.root, sticky && styles.sticky, className)}
      style={style}
    >
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === lastIndex;
          const key = item.href ?? `${item.label}-${index}`;
          return (
            <li className={styles.item} key={key}>
              {isLast || !item.href ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
              {index < lastIndex ? (
                <span className={styles.separator} aria-hidden="true">
                  {" / "}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
