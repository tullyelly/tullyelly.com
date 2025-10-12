"use client";

import * as React from "react";

export type ActivityStatus = "starting" | "running" | "done" | "error";

export type ActivityRecord = {
  id: string;
  label: string;
  status: ActivityStatus;
  progress?: number;
  detail?: string;
  createdAt: number;
  updatedAt: number;
};

type StartOptions = {
  id?: string;
  status?: ActivityStatus;
  progress?: number;
  detail?: string;
};

type UpdateOptions = {
  status?: ActivityStatus;
  progress?: number;
  label?: string;
  detail?: string;
};

type CompletionOptions = {
  detail?: string;
};

type ActivityState = ActivityRecord[];

type ActivityAction =
  | { type: "add"; record: ActivityRecord }
  | { type: "update"; id: string; changes: Partial<ActivityRecord> }
  | { type: "remove"; id: string };

function activityReducer(state: ActivityState, action: ActivityAction) {
  switch (action.type) {
    case "add": {
      const withoutExisting = state.filter(
        (record) => record.id !== action.record.id,
      );
      return [...withoutExisting, action.record];
    }
    case "update": {
      return state.map((record) =>
        record.id === action.id
          ? {
              ...record,
              ...action.changes,
            }
          : record,
      );
    }
    case "remove": {
      return state.filter((record) => record.id !== action.id);
    }
    default: {
      return state;
    }
  }
}

type ActivityContextValue = {
  activities: ActivityRecord[];
  start: (label: string, options?: StartOptions) => string;
  update: (id: string, options: UpdateOptions) => void;
  done: (id: string, options?: CompletionOptions) => void;
  error: (id: string, detail?: string) => void;
  dismiss: (id: string) => void;
};

const ActivityContext = React.createContext<ActivityContextValue | undefined>(
  undefined,
);

function safeProgress(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, Math.round(value)));
}

let activitySequence = 0;

function nextSequence(): number {
  activitySequence += 1;
  return activitySequence;
}

function generateId() {
  return `activity-${nextSequence().toString(36)}`;
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(activityReducer, []);
  const removalTimers = React.useRef<Map<string, number>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const clearTimer = React.useCallback((id: string) => {
    const timers = removalTimers.current;
    const handle = timers.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.delete(id);
    }
  }, []);

  const scheduleRemoval = React.useCallback(
    (id: string, delay: number) => {
      clearTimer(id);
      const timeout = window.setTimeout(() => {
        dismiss(id);
        removalTimers.current.delete(id);
      }, delay);
      removalTimers.current.set(id, timeout);
    },
    [clearTimer, dismiss],
  );

  const start = React.useCallback(
    (label: string, options?: StartOptions) => {
      const id = options?.id ?? generateId();
      const progress = safeProgress(options?.progress);
      const status = options?.status ?? "starting";
      const now = nextSequence();
      dispatch({
        type: "add",
        record: {
          id,
          label,
          status,
          progress,
          detail: options?.detail,
          createdAt: now,
          updatedAt: now,
        },
      });
      clearTimer(id);
      return id;
    },
    [clearTimer],
  );

  const update = React.useCallback((id: string, options: UpdateOptions) => {
    const progress = safeProgress(options.progress);
    const status =
      options.status ?? (typeof progress === "number" ? "running" : undefined);
    dispatch({
      type: "update",
      id,
      changes: {
        ...(options.label ? { label: options.label } : null),
        ...(typeof progress === "number" ? { progress } : null),
        ...(options.detail ? { detail: options.detail } : null),
        ...(status ? { status } : null),
        updatedAt: nextSequence(),
      },
    });
  }, []);

  const done = React.useCallback(
    (id: string, options?: CompletionOptions) => {
      dispatch({
        type: "update",
        id,
        changes: {
          status: "done",
          progress: 100,
          detail: options?.detail,
          updatedAt: nextSequence(),
        },
      });
      scheduleRemoval(id, 2000);
    },
    [scheduleRemoval],
  );

  const error = React.useCallback(
    (id: string, detail?: string) => {
      dispatch({
        type: "update",
        id,
        changes: {
          status: "error",
          detail,
          updatedAt: nextSequence(),
        },
      });
      scheduleRemoval(id, 6000);
    },
    [scheduleRemoval],
  );

  React.useEffect(() => {
    const timers = removalTimers.current;
    return () => {
      timers.forEach((handle) => window.clearTimeout(handle));
      timers.clear();
    };
  }, []);

  const value = React.useMemo<ActivityContextValue>(
    () => ({
      activities: state,
      start,
      update,
      done,
      error,
      dismiss: (id: string) => {
        clearTimer(id);
        dismiss(id);
      },
    }),
    [clearTimer, dismiss, done, start, state, update, error],
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity(): ActivityContextValue {
  const context = React.useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}
