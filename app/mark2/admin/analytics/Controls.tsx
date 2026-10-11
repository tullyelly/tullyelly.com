"use client";
import { useActionState } from "react";
import { BusyButton } from "@/components/ui/busy-button";
import { Input } from "@/components/ui/input";
import { analyticsAction } from "./actions";

export default function AnalyticsControls({
  enabled,
  range,
  hasPendingImport,
}: {
  enabled: boolean;
  range: { from: string; through: string } | null;
  hasPendingImport: boolean;
}) {
  const [result, action, pending] = useActionState(analyticsAction, null);
  return (
    <div className="space-y-4">
      <form
        action={action}
        className="flex flex-wrap gap-3"
        aria-busy={pending}
      >
        <BusyButton
          type="submit"
          name="operation"
          value="test"
          isLoading={pending}
          loadingLabel="Working..."
        >
          Test connection
        </BusyButton>
        <BusyButton
          type="submit"
          name="operation"
          value="daily"
          disabled={!enabled || !range}
          isLoading={pending}
          variant="outline"
        >
          Run now
        </BusyButton>
        <BusyButton
          type="submit"
          name="operation"
          value="continue"
          disabled={!enabled || !range || !hasPendingImport}
          isLoading={pending}
          variant="outline"
        >
          Continue import
        </BusyButton>
      </form>
      <form action={action} className="space-y-3" aria-busy={pending}>
        <p className="text-sm text-muted-foreground">
          Select a supported range of completed UTC days. Each request processes
          one bounded batch; use Continue import until the saved range finishes.
        </p>
        <div className="flex flex-wrap gap-4">
          <label htmlFor="analytics-from" className="space-y-1 text-sm">
            From (UTC)
            <Input
              id="analytics-from"
              name="from"
              type="date"
              required
              min={range?.from}
              max={range?.through}
              disabled={pending || !range || hasPendingImport}
            />
          </label>
          <label htmlFor="analytics-through" className="space-y-1 text-sm">
            Through (UTC, inclusive)
            <Input
              id="analytics-through"
              name="through"
              type="date"
              required
              min={range?.from}
              max={range?.through}
              disabled={pending || !range || hasPendingImport}
            />
          </label>
        </div>
        <BusyButton
          type="submit"
          name="operation"
          value="import"
          disabled={!enabled || !range || hasPendingImport}
          isLoading={pending}
          variant="outline"
        >
          Import history
        </BusyButton>
      </form>
      <p role="status" aria-live="polite" className="text-sm">
        {result
          ? `${result.status}: ${result.message}${result.processed !== undefined ? ` ${result.processed} days committed; ${result.requests} queries attempted.` : ""}`
          : "No action requested."}
      </p>
    </div>
  );
}
