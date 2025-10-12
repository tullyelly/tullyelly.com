"use client";

import * as React from "react";
import { Check, Loader2, X, XCircle } from "lucide-react";
import { useActivity } from "./activity-provider";
import { useHasReducedMotion } from "@/hooks/use-has-reduced-motion";
import { cn } from "@/lib/utils";

type ActivityToastProps = {
  id: string;
  label: string;
  status: "starting" | "running" | "done" | "error";
  progress?: number;
  detail?: string;
  onDismiss: (id: string) => void;
  reducedMotion: boolean;
};

function ActivityToast({
  id,
  label,
  status,
  progress,
  detail,
  onDismiss,
  reducedMotion,
}: ActivityToastProps) {
  const roundedProgress =
    typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;

  const icon = (() => {
    if (status === "done") {
      return <Check className="h-4 w-4 text-green-600" aria-hidden="true" />;
    }
    if (status === "error") {
      return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
    }
    return (
      <Loader2
        className={cn(
          "h-4 w-4 text-blue-600",
          reducedMotion ? "" : "motion-safe:animate-spin",
        )}
        aria-hidden="true"
      />
    );
  })();

  const statusText = (() => {
    if (status === "starting") return detail || "Starting…";
    if (status === "running") {
      if (roundedProgress !== null) {
        return detail || `Running ${roundedProgress}%`;
      }
      return detail || "Running…";
    }
    if (status === "done") return detail || "Done";
    if (status === "error")
      return detail || "An error occurred; please review the task.";
    return detail ?? "";
  })();

  return (
    <li>
      <div
        className="pointer-events-auto rounded-xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label={`${label}: ${statusText}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{icon}</span>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="text-xs text-ink/70">
              {statusText}
              {roundedProgress !== null ? (
                <span className="sr-only">{`Progress ${roundedProgress} percent`}</span>
              ) : null}
            </p>
            {roundedProgress !== null ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle/70">
                <div
                  className={cn(
                    "h-full bg-blue-600",
                    reducedMotion
                      ? ""
                      : "transition-[width] duration-200 ease-out",
                  )}
                  style={{ width: `${roundedProgress}%` }}
                  aria-hidden="true"
                />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-ink/60 transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label="Dismiss status"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ActivityToaster() {
  const { activities, dismiss } = useActivity();
  const reducedMotion = useHasReducedMotion();

  if (activities.length === 0) return null;

  const orderedActivities = [...activities].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[70]",
        "left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:top-6 sm:bottom-auto",
      )}
    >
      <ul className="flex flex-col gap-3 sm:w-80">
        {orderedActivities.map((activity) => (
          <ActivityToast
            key={activity.id}
            id={activity.id}
            label={activity.label}
            status={activity.status}
            progress={activity.progress}
            detail={activity.detail}
            onDismiss={dismiss}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>
    </div>
  );
}
