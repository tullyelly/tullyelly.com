"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { SuggestionSource } from "@/components/navigation/useLocalSuggestions";

type NavigationSearchProps = {
  autoFocus?: boolean;
  onSubmitted?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  focusDelayMs?: number;
  escCloses?: boolean;
  persona?: string | null;
  suggestions?: SuggestionSource[];
  onSuggestionClick?: (suggestion: SuggestionSource) => void;
  onQueryChange?: (value: string) => void;
};

export default function NavigationSearch({
  autoFocus = true,
  onSubmitted,
  onCancel,
  placeholder = "Search",
  className,
  focusDelayMs = 250,
  escCloses = false,
  persona = null,
  suggestions = [],
  onSuggestionClick,
  onQueryChange,
}: NavigationSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";
  const [query, setQuery] = React.useState(initialQuery);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    onQueryChange?.(initialQuery);
  }, [initialQuery, onQueryChange]);

  React.useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => {
      const node = inputRef.current;
      if (node) {
        node.focus();
        const nextCursor = node.value.length;
        node.setSelectionRange(nextCursor, nextCursor);
      }
    }, focusDelayMs);
    return () => window.clearTimeout(timer);
  }, [autoFocus, focusDelayMs]);

  const submit = React.useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const target = `/search?q=${encodeURIComponent(trimmed)}`;
    analytics.track("nav.search.submit", {
      persona,
      query: trimmed,
      queryLength: trimmed.length,
      mode: "submit",
    });
    router.push(target);
    onSubmitted?.();
  }, [persona, query, router, onSubmitted]);

  const handleEscape = React.useCallback(() => {
    if (escCloses) {
      onSubmitted?.();
      return;
    }
    if (query.length) {
      setQuery("");
    } else {
      onCancel?.();
    }
  }, [escCloses, onSubmitted, onCancel, query.length]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> =
    React.useCallback(
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          handleEscape();
        }
      },
      [submit, handleEscape],
    );

  const onSubmit: React.FormEventHandler<HTMLFormElement> = React.useCallback(
    (event) => {
      event.preventDefault();
      submit();
    },
    [submit],
  );

  const handleChange = React.useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
    },
    [onQueryChange],
  );

  const handleSuggestionClick = React.useCallback(
    (suggestion: SuggestionSource) => {
      analytics.track("nav.search.submit", {
        persona,
        query: suggestion.title,
        queryLength: suggestion.title.length,
        mode: "suggestion",
      });
      router.push(suggestion.href);
      onSuggestionClick?.(suggestion);
      onSubmitted?.();
    },
    [onSuggestionClick, onSubmitted, persona, router],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-2xl border-[0.5px] border-[color:var(--border-subtle,#d1d5db)] bg-[color:var(--surface-card,#f0ebd2)] px-3 py-2"
      >
        <label htmlFor="mobile-nav-search" className="sr-only">
          Search
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 text-[color:var(--text-muted,#58708c)]"
        >
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.75 4.75l1.5-1.5L15.5 14m-6 0A4.5 4.5 0 1 1 14 9.5A4.5 4.5 0 0 1 9.5 14"
          />
        </svg>
        <input
          ref={inputRef}
          id="mobile-nav-search"
          type="search"
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search"
          className="h-12 flex-1 bg-transparent text-base text-[color:var(--text-strong,#0e2240)] outline-none placeholder:text-[color:var(--text-muted,#58708c)]"
        />
        {query.length ? (
          <button
            type="button"
            onClick={() => handleChange("")}
            className="rounded-full p-1.5 text-[color:var(--text-muted,#58708c)] transition hover:text-[color:var(--text-strong,#0e2240)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)]"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="m12 10.586l4.95-4.95l1.414 1.414L13.414 12l4.95 4.95l-1.414 1.414L12 13.414l-4.95 4.95l-1.414-1.414L10.586 12l-4.95-4.95l1.414-1.414L12 10.586"
              />
            </svg>
          </button>
        ) : null}
      </form>

      {suggestions.length ? (
        <div className="space-y-1 rounded-2xl border border-[color:var(--border-subtle,#d1d5db)] bg-white p-1">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text-strong,#0e2240)] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue,#0077c0)]"
              onClick={() => handleSuggestionClick(item)}
            >
              <span className="block font-medium">{item.title}</span>
              {item.subtitle ? (
                <span className="mt-0.5 block text-xs text-[color:var(--text-muted,#58708c)]">
                  {item.subtitle}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : query.trim() ? (
        <p className="px-3 text-xs text-[color:var(--text-muted,#58708c)]">
          Press Search to explore all results.
        </p>
      ) : null}
    </div>
  );
}
