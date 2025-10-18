import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/lib/breadcrumbs/types";
import styles from "./bookmark.module.css";

type BookmarkBreadcrumbProps = {
  items: Crumb[];
};

export default function BookmarkBreadcrumb({ items }: BookmarkBreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const lastIndex = items.length - 1;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("absolute left-0 top-0 z-[2]", styles.root)}
    >
      <div
        className={cn(
          "rounded-r-lg border-2 border-brand-bucksGreen bg-[var(--cream)] px-3 py-1.5 shadow-sm",
          styles.badge,
        )}
      >
        <ol className="flex list-none items-center gap-1.5 text-sm leading-tight font-medium text-ink">
          {items.map((item, index) => {
            const isLast = index === lastIndex;
            const key = `${item.href ?? item.label ?? "crumb"}-${index}`;
            const content =
              typeof item.label === "string" ? item.label.trim() : "";

            const node =
              !isLast && item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center px-2 py-1 text-ink visited:text-ink transition-colors no-underline underline-offset-4 hover:text-brand-bucksGreen hover:underline hover:decoration-brand-bucksGreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bucksGreen focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)]"
                  title={content}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center",
                    isLast
                      ? "px-0 py-0 font-semibold text-brand-bucksGreen cursor-default"
                      : "px-2 py-1 text-ink/80",
                  )}
                  title={content}
                >
                  {content}
                </span>
              );

            return (
              <li key={key} className="flex items-center">
                {node}
                {index < lastIndex ? (
                  <span aria-hidden="true" className="mx-1.5 text-ink/50">
                    /
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
