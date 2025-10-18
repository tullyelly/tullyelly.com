import { cn } from "@/lib/cn";
import { getBadgeClass } from "@/app/ui/badge-maps";

export function YearBadge({
  year,
  className,
}: {
  year: number | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute right-3 top-3 z-10 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
        getBadgeClass("year"),
        // Force Bucks green via CSS var to win specificity/purge battles
        "!bg-[var(--green)] !text-white",
        className,
      )}
    >
      {year}
    </span>
  );
}
