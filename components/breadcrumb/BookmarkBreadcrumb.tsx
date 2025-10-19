import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Crumb } from "@/lib/breadcrumbs/types";
import styles from "./bookmark.module.css";

type BookmarkBreadcrumbProps = {
  items: Crumb[];
  skeleton?: boolean;
};

export default function BookmarkBreadcrumb({
  items,
  skeleton = false,
}: BookmarkBreadcrumbProps) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const showSkeleton = skeleton || !hasItems;
  const lastIndex = hasItems ? items.length - 1 : 0;

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="breadcrumb"
      aria-busy={showSkeleton ? "true" : undefined}
      className={cn("absolute left-0 top-0 z-[2]", styles.root)}
    >
      <div
        className={cn(
          "rounded-r-lg border-2 border-brand-bucksGreen bg-[var(--cream)] px-3 py-1.5 shadow-sm",
          styles.badge,
        )}
      >
        <ol className="flex list-none items-center gap-1.5 text-sm leading-tight font-medium text-ink">
          {showSkeleton ? (
            <li className="flex items-center gap-1.5">
              <span className="sr-only">Home</span>
              <Skeleton
                aria-hidden="true"
                className="h-6 min-w-[3.5rem] rounded-sm bg-border-subtle/70 motion-safe:animate-pulse"
              />
            </li>
          ) : (
            items.map((item, index) => {
              const isLast = index === lastIndex;
              const key = `${item.href ?? item.label ?? "crumb"}-${index}`;
              const content =
                typeof item.label === "string" ? item.label.trim() : "";

              const node =
                !isLast && item.href ? (
                  <Link
                    href={item.href as Route}
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
            })
          )}
        </ol>
      </div>
    </nav>
  );
}
