import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/lib/breadcrumb-registry";
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
      className={cn(
        "absolute left-0 top-0 z-[2] -translate-x-[0.75rem]",
        styles.root,
      )}
    >
      <div
        className={cn(
          "rounded-r-2xl border border-black/5 bg-[var(--cream)] px-3 py-1.5 shadow-sm",
          styles.badge,
        )}
      >
        <ol className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
          {items.map((item, index) => {
            const isLast = index === lastIndex;
            const key = item.href ?? `${item.label}-${index}`;
            const content = item.label;

            const node =
              !isLast && item.href ? (
                <Link
                  href={item.href}
                  className="text-brand-greatLakesBlue visited:text-brand-greatLakesBlue hover:underline focus-visible:ring-2 focus-visible:ring-brand-greatLakesBlue focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)] focus-visible:outline-none transition-colors"
                  title={content}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "text-ink",
                    isLast ? "opacity-70" : "opacity-90",
                  )}
                  title={content}
                >
                  {content}
                </span>
              );

            return (
              <li key={key} className="flex items-center gap-2">
                {node}
                {index < lastIndex ? (
                  <span aria-hidden="true" className="text-ink/40">
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
