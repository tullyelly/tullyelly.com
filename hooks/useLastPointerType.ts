"use client";

import * as React from "react";

export type PointerKind = "mouse" | "touch" | "pen" | "keyboard" | "unknown";

type PointerEventLike =
  | React.PointerEvent<Element>
  | PointerEvent
  | (Event & { pointerType?: string | null | undefined });

const supportsPointerEvents =
  typeof globalThis !== "undefined" && "PointerEvent" in globalThis;

function normalizePointerType(type: string | null | undefined): PointerKind {
  if (type === "mouse" || type === "touch" || type === "pen") {
    return type;
  }
  if (!supportsPointerEvents) {
    return "mouse";
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
    const pointerType =
      typeof event.pointerType === "string" ? event.pointerType : undefined;
    let nextKind = normalizePointerType(pointerType);

    if (nextKind === "unknown") {
      const eventType =
        "type" in event && typeof event.type === "string" ? event.type : null;
      if (eventType?.startsWith("mouse") || eventType === "click") {
        nextKind = "mouse";
      } else if (eventType?.startsWith("touch")) {
        nextKind = "touch";
      } else if (eventType?.startsWith("pen")) {
        nextKind = "pen";
      } else if (!supportsPointerEvents) {
        nextKind = "mouse";
      }
    }

    last.current = nextKind;
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
