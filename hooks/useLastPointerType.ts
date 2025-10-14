"use client";

import * as React from "react";

export type PointerKind = "mouse" | "touch" | "pen" | "keyboard" | "unknown";

type PointerEventLike =
  | React.PointerEvent<Element>
  | PointerEvent
  | { pointerType?: string | null | undefined };

function normalizePointerType(type: string | null | undefined): PointerKind {
  if (type === "mouse" || type === "touch" || type === "pen") {
    return type;
  }
  return "unknown";
}

/**
 * Track which modality most recently interacted with a trigger element.
 * Consumers can update the value in pointer/keyboard handlers and read it when
 * deciding whether to drive hover intent or fall back to click toggles.
 */
export function useLastPointerType(initial: PointerKind = "unknown") {
  const last = React.useRef<PointerKind>(initial);

  const setFromPointerEvent = React.useCallback((event: PointerEventLike) => {
    if (!event) return;
    last.current = normalizePointerType(event.pointerType);
  }, []);

  const setKeyboard = React.useCallback(() => {
    last.current = "keyboard";
  }, []);

  const get = React.useCallback(() => last.current, []);

  return {
    setFromPointerEvent,
    setKeyboard,
    get,
  };
}
