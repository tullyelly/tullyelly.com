"use client";

import * as React from "react";
import {
  autoUpdate,
  flip,
  offset,
  safePolygon,
  shift,
  useDelayGroup,
  useFloating,
  useHover,
  useInteractions,
  type Placement,
} from "@floating-ui/react";

type DelayValue = number | { open?: number; close?: number };

export const CLOSE_DELAY_MS = 150;

function resolveDelay(
  preferred: DelayValue | undefined,
  fallbackOpen: number,
  fallbackClose: number,
): { open: number; close: number } {
  if (typeof preferred === "number") {
    return { open: preferred, close: preferred };
  }
  const open = preferred?.open;
  const close = preferred?.close;
  return {
    open: typeof open === "number" ? open : fallbackOpen,
    close: typeof close === "number" ? close : fallbackClose,
  };
}

type ControlledState = {
  value: boolean | undefined;
  defaultValue: boolean;
  onChange?: (value: boolean) => void;
};

function useControlledBoolean({
  value,
  defaultValue,
  onChange,
}: ControlledState): [boolean, (next: boolean) => void] {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = typeof value === "boolean";

  const current = isControlled ? (value as boolean) : internal;

  const setValue = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}

export type UseMenuAimOptions = {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  buffer?: number;
  enabled?: boolean;
  placement?: Placement;
};

export type UseMenuAimResult = {
  open: boolean;
  setOpen: (open: boolean) => void;
  reference: (node: HTMLElement | null) => void;
  floating: (node: HTMLElement | null) => void;
  getReferenceProps: <T extends Record<string, unknown>>(
    userProps?: T,
  ) => T & Record<string, unknown>;
  getFloatingProps: <T extends Record<string, unknown>>(
    userProps?: T,
  ) => T & Record<string, unknown>;
  x: number | null;
  y: number | null;
  strategy: ReturnType<typeof useFloating>["strategy"];
  context: ReturnType<typeof useFloating>["context"];
  refs: ReturnType<typeof useFloating>["refs"];
  delayGroup: ReturnType<typeof useDelayGroup>;
};

export function useMenuAim(options: UseMenuAimOptions = {}): UseMenuAimResult {
  const {
    id,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    openDelay = 110,
    closeDelay = CLOSE_DELAY_MS,
    buffer = 6,
    enabled = true,
    placement = "right-start",
  } = options;

  const [open, setOpen] = useControlledBoolean({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const floating = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const delayGroup = useDelayGroup(floating.context, { id });

  const mergedDelay = React.useMemo(() => {
    const groupDelay = delayGroup.delay as DelayValue | undefined;
    return resolveDelay(groupDelay, openDelay, closeDelay);
  }, [closeDelay, delayGroup.delay, openDelay]);

  const hover = useHover(floating.context, {
    enabled,
    delay: mergedDelay,
    handleClose: safePolygon({
      buffer,
    }),
  });

  const interactions = useInteractions([hover]);

  const getReferenceProps = React.useCallback(
    <T extends Record<string, unknown>>(userProps?: T) => {
      const props = interactions.getReferenceProps(
        userProps ?? ({} as T),
      ) as Record<string, unknown> & T;
      const originalEnter = props.onPointerEnter as
        | ((event: PointerEvent) => void)
        | undefined;
      return {
        ...props,
        onPointerEnter(event: PointerEvent) {
          delayGroup.setCurrentId(id ?? floating.context.nodeId ?? null);
          originalEnter?.(event);
        },
      } as T & Record<string, unknown>;
    },
    [delayGroup, floating.context.nodeId, id, interactions],
  );

  const getFloatingProps = React.useCallback(
    <T extends Record<string, unknown>>(userProps?: T) =>
      interactions.getFloatingProps(userProps ?? ({} as T)) as T &
        Record<string, unknown>,
    [interactions],
  );

  return {
    open,
    setOpen,
    reference: floating.refs.setReference,
    floating: floating.refs.setFloating,
    getReferenceProps,
    getFloatingProps,
    x: floating.x,
    y: floating.y,
    strategy: floating.strategy,
    context: floating.context,
    refs: floating.refs,
    delayGroup,
  };
}
