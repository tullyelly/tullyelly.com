import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

type TextLinesProps = {
  lines?: number;
  className?: string;
};

export function TextLines({ lines = 3, className }: TextLinesProps) {
  const safeLineCount = Math.max(1, Math.min(lines, 8));
  const widthCycle = ["w-full", "w-11/12", "w-3/4"];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: safeLineCount }, (_, index) => {
        const widthClass =
          widthCycle[index % widthCycle.length] ?? widthCycle[0];
        return <Skeleton key={index} className={cn("h-4", widthClass)} />;
      })}
    </div>
  );
}

type CardProps = {
  lines?: number;
  className?: string;
};

export function Card({ lines = 3, className }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm",
        className,
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <TextLines lines={lines} />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    </div>
  );
}

type AvatarLineProps = {
  className?: string;
};

export function AvatarLine({ className }: AvatarLineProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3",
        className,
      )}
    >
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

type TableRowProps = {
  cells?: number;
  className?: string;
};

export function TableRow({ cells = 4, className }: TableRowProps) {
  const safeCells = Math.min(Math.max(cells, 3), 6);

  return (
    <div
      className={cn(
        "flex w-full items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3",
        className,
      )}
    >
      {Array.from({ length: safeCells }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4 flex-1",
            index === 0 && "max-w-[140px]",
            index === safeCells - 1 && "max-w-[100px]",
          )}
        />
      ))}
    </div>
  );
}

export const AppSkeleton = {
  TextLines,
  Card,
  AvatarLine,
  TableRow,
};
