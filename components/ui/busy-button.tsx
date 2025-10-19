"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BusyButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingLabel?: string;
}

export const BusyButton = React.forwardRef<HTMLButtonElement, BusyButtonProps>(
  (
    {
      isLoading = false,
      loadingLabel = "Loading...",
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isBusy = Boolean(isLoading);

    return (
      <Button
        ref={ref}
        className={cn(
          "aria-busy motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out",
          className,
        )}
        aria-busy={isBusy ? "true" : undefined}
        data-busy={isBusy ? "true" : undefined}
        data-state={isBusy ? "loading" : undefined}
        disabled={disabled || isBusy}
        {...props}
      >
        <span
          aria-live="polite"
          className="inline-flex items-center justify-center gap-2"
        >
          {isBusy ? (
            <>
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 text-current motion-safe:animate-spin motion-reduce:animate-none"
              />
              <span>{loadingLabel}</span>
            </>
          ) : (
            children
          )}
        </span>
      </Button>
    );
  },
);
BusyButton.displayName = "BusyButton";
