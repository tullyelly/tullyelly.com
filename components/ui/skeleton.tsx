import * as React from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md bg-border-subtle/80 text-transparent motion-safe:animate-pulse motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";
