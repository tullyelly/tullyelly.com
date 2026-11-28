"use client";

import { useSyncExternalStore } from "react";
import {
  readDirectoryValue,
  updateDirectoryQuery,
} from "@/lib/directory-state";

const changeEvent = "directory-query-change";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(changeEvent, listener);
  };
}
const snapshot = () => window.location.search;
const serverSnapshot = () => "";

export function useDirectorySearch() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Native history integrates with Next navigation without refetching client data. */
export function useDirectoryField<T extends string | number>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (value: T) => void] {
  const search = useDirectorySearch();
  const value = readDirectoryValue(
    new URLSearchParams(search),
    key,
    fallback,
    allowed,
  );
  function update(next: T) {
    const query = updateDirectoryQuery(
      window.location.search,
      key,
      next,
      fallback,
    );
    const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (
      url ===
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    )
      return;
    if (key === "q") window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(changeEvent));
  }
  return [value, update];
}
