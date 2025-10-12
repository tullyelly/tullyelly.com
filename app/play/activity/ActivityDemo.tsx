"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BusyButton } from "@/components/ui/busy-button";
import { useActivity } from "@/components/activity/activity-provider";

function useDemoJob() {
  const { start, update, done, error } = useActivity();
  const intervalRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const activityIdRef = React.useRef<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const clearTimers = React.useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startJob = React.useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    clearTimers();
    const id = start("Demo import job", {
      status: "starting",
      detail: "Kickoff in progress",
      progress: 0,
    });
    activityIdRef.current = id;

    let pct = 0;

    update(id, {
      status: "running",
      detail: "Processing records",
      progress: pct,
    });

    intervalRef.current = window.setInterval(() => {
      pct = Math.min(100, pct + 10);
      if (!activityIdRef.current) {
        clearTimers();
        return;
      }
      update(activityIdRef.current, {
        progress: pct,
        detail: pct < 100 ? `Processing records (${pct}%)` : undefined,
      });

      if (pct >= 100) {
        clearTimers();
        done(activityIdRef.current, { detail: "Demo job complete" });
        activityIdRef.current = null;
        setIsRunning(false);
      }
    }, 1000);
  }, [clearTimers, done, isRunning, start, update]);

  const failJob = React.useCallback(() => {
    if (isRunning) return;
    clearTimers();
    setIsRunning(true);
    const id = start("Demo import job", {
      status: "running",
      detail: "Starting simulated failure",
    });
    activityIdRef.current = id;
    update(id, { detail: "Processing records", progress: 20 });
    timeoutRef.current = window.setTimeout(() => {
      error(id, "Demo job failed after a simulated network issue.");
      activityIdRef.current = null;
      clearTimers();
      setIsRunning(false);
    }, 1500);
  }, [clearTimers, error, isRunning, start, update]);

  React.useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  return {
    startJob,
    failJob,
    isRunning,
  };
}

export default function ActivityDemo() {
  const { startJob, failJob, isRunning } = useDemoJob();

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Background activity demo</h2>
        <p className="text-sm text-muted-foreground">
          Use these buttons to simulate a long-running task. Progress updates
          appear in the activity toaster.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <BusyButton
          onClick={startJob}
          isLoading={isRunning}
          loadingLabel="Running demo…"
          disabled={isRunning}
        >
          Start demo job
        </BusyButton>
        <Button
          type="button"
          variant="outline"
          onClick={failJob}
          disabled={isRunning}
        >
          Trigger failure
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The job runs for roughly ten seconds; progress updates continue even if
        you navigate away from the page.
      </p>
    </div>
  );
}
