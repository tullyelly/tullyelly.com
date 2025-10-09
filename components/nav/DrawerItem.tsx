import * as React from "react";
import { cn } from "@/lib/utils";

type DrawerItemProps = React.HTMLAttributes<HTMLDivElement>;

const DrawerItem = React.forwardRef<HTMLDivElement, DrawerItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group flex min-h-[44px] items-center gap-3 rounded-2xl border-[0.5px] border-[color:var(--border-subtle,#d1d5db)] bg-[color:var(--surface-card,#f0ebd2)] px-3 py-2 text-base font-medium leading-6 text-[color:var(--text-strong,#0e2240)] transition-colors",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-[color:var(--brand-blue,#0077c0)] focus-within:ring-offset-0",
          "hover:bg-[color:var(--surface-card,#f0ebd2)]/90",
          "active:bg-[color:var(--surface-card,#f0ebd2)]/80",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DrawerItem.displayName = "DrawerItem";

export default DrawerItem;
