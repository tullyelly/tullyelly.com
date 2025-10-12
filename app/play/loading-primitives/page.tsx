"use client";

import * as React from "react";

import {
  AvatarLine,
  Card,
  TableRow,
  TextLines,
} from "@/components/app-skeleton";
import { BusyButton } from "@/components/ui/busy-button";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LoadingPrimitivesPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startDemo = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      timeoutRef.current = null;
    }, 1500);
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-10 text-sm">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-ink">
          Loading language preview
        </h1>
        <p className="max-w-2xl text-base text-text-primary">
          Spinner, skeleton, and busy button primitives share the same accent
          color so they read as one family of feedback patterns.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Spinner sizes
        </h2>
        <div className="flex items-center gap-8 text-green">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs">Large</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-text-primary">
            Try toggling reduced motion in your system preferences; the spinner
            will swap to a text announcement.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Skeletons</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">
              Text lines
            </h3>
            <TextLines lines={4} />
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">
              Avatar line
            </h3>
            <AvatarLine />
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">Card</h3>
            <Card lines={5} />
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">
              Table rows
            </h3>
            <div className="space-y-3">
              <TableRow cells={4} />
              <TableRow cells={6} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Busy button</h2>
        <div className="flex flex-wrap items-center gap-4">
          <BusyButton
            isLoading={isLoading}
            loadingLabel="Processing request..."
            onClick={startDemo}
          >
            Start demo
          </BusyButton>
          <Button variant="secondary" onClick={() => setIsLoading(false)}>
            Reset
          </Button>
        </div>
        <p className="text-text-primary">
          Click the busy button to lock it for fifteen hundred milliseconds and
          show the spinner with the loading label.
        </p>
      </section>
    </main>
  );
}
