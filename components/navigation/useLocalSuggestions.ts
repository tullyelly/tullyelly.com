"use client";

import * as React from "react";
import Fuse from "fuse.js";

export type SuggestionSource = {
  id: string;
  title: string;
  href: string;
  subtitle?: string | null;
  persona?: string | null;
};

type Options = {
  limit?: number;
};

export function useLocalSuggestions(
  items: SuggestionSource[],
  query: string,
  { limit = 5 }: Options = {},
): SuggestionSource[] {
  const stableItems = React.useMemo(
    () =>
      items.map((item) => ({
        ...item,
        title: item.title ?? "",
        subtitle: item.subtitle ?? "",
        persona: item.persona ?? "",
      })),
    [items],
  );

  const fuse = React.useMemo(() => {
    if (!stableItems.length) {
      return null;
    }
    return new Fuse(stableItems, {
      threshold: 0.35,
      includeScore: true,
      keys: [
        { name: "title", weight: 0.6 },
        { name: "subtitle", weight: 0.2 },
        { name: "persona", weight: 0.2 },
      ],
    });
  }, [stableItems]);

  return React.useMemo(() => {
    const text = query.trim();
    if (!text || !fuse) return [];
    return fuse
      .search(text)
      .slice(0, limit)
      .map((entry) => entry.item);
  }, [fuse, query, limit]);
}
