"use client";

import * as React from "react";

export function useOpenShield(timeoutMs = 120) {
  const openedAtRef = React.useRef<number>(0);

  const arm = React.useCallback(() => {
    openedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
  }, []);

  const shouldIgnore = React.useCallback(() => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    return now - openedAtRef.current < timeoutMs;
  }, [timeoutMs]);

  return { arm, shouldIgnore };
}
