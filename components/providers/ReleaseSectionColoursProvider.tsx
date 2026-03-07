import { createContext, useContext, useId, type ReactNode } from "react";

import { buildRainbowColourList } from "@/lib/release-section-colours";

type ReleaseSectionColoursContextValue = {
  colours: string[];
  assignments: Map<string, number>;
  nextIndex: number;
};

const ReleaseSectionColoursContext =
  createContext<ReleaseSectionColoursContextValue | null>(null);

type ReleaseSectionColoursProviderProps = {
  totalSections: number;
  children: ReactNode;
};

const toSafeSectionCount = (totalSections: number): number => {
  if (!Number.isFinite(totalSections)) return 0;
  return Math.max(0, Math.floor(totalSections));
};

const getOrAssignConsumerIndex = (
  context: ReleaseSectionColoursContextValue,
  consumerId: string,
): number => {
  const existingIndex = context.assignments.get(consumerId);
  if (existingIndex !== undefined) return existingIndex;

  const assignedIndex = context.nextIndex;
  context.assignments.set(consumerId, assignedIndex);
  context.nextIndex += 1;
  return assignedIndex;
};

/**
 * Provides a per-render rainbow sequence for ReleaseSection-like consumers.
 * Intended usage: wrap a page/section that renders multiple ReleaseSection nodes;
 * each call to useNextRainbowColour() consumes the next slot in this render tree.
 */
export function ReleaseSectionColoursProvider({
  totalSections,
  children,
}: ReleaseSectionColoursProviderProps) {
  const contextValue: ReleaseSectionColoursContextValue = {
    colours: buildRainbowColourList(toSafeSectionCount(totalSections)),
    assignments: new Map<string, number>(),
    nextIndex: 0,
  };

  return (
    <ReleaseSectionColoursContext.Provider value={contextValue}>
      {children}
    </ReleaseSectionColoursContext.Provider>
  );
}

/**
 * Returns the next rainbow colour from the nearest provider sequence.
 * - Outside provider: returns undefined safely.
 * - Overflow: wraps to the beginning of the provider's colour list.
 */
export function useNextRainbowColour(): string | undefined {
  const context = useContext(ReleaseSectionColoursContext);
  const consumerId = useId();

  if (!context || context.colours.length === 0) return undefined;

  const assignedIndex = getOrAssignConsumerIndex(context, consumerId);
  const wrappedIndex = assignedIndex % context.colours.length;
  return context.colours[wrappedIndex];
}
