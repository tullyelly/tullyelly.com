"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CodePanelProps = {
  code: string;
  language?: string;
  label?: string;
  className?: string;
};

const COPIED_TIMEOUT_MS = 1500;

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function CodePanel({
  code,
  language,
  label,
  className,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerLabel = label ?? language;
  const showLanguage = Boolean(label && language);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, COPIED_TIMEOUT_MS);
    } catch {
      setCopied(false);
    }
  }, [code]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "not-prose overflow-hidden rounded-lg border border-white/10 bg-ink text-white",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/10 px-3 py-2 text-xs",
          headerLabel ? "justify-between" : "justify-end",
        )}
      >
        {headerLabel ? (
          <div className="min-w-0 truncate text-white/70">
            <span className="font-medium text-white/80">{headerLabel}</span>
            {showLanguage ? (
              <span className="ml-2 text-[0.7rem] uppercase tracking-wide text-white/50">
                {language}
              </span>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-medium transition",
            copied
              ? "border-white/20 bg-white/20 text-white"
              : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:text-white",
          )}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="max-h-[70vh] overflow-x-auto px-3 py-3 font-mono text-xs leading-relaxed text-white/90 sm:text-sm">
        <code className={language ? `language-${language}` : undefined}>
          {code}
        </code>
      </pre>
    </div>
  );
}
