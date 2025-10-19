"use client";

import { Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";

export const dynamic = "force-dynamic";

// Accept undefined to keep TS happy; restrict to path-only callbacks (same-origin)
function sanitizeCallback(raw?: string | null, currentOrigin?: string): string {
  if (!raw) return "/";
  try {
    const base = currentOrigin || "http://localhost";
    const url = new URL(raw, base);
    // Allow relative paths always. Allow absolute URLs only if same-origin.
    const isRelative = raw.startsWith("/") || !/^https?:/i.test(raw);
    const isSameOrigin = !!currentOrigin && url.origin === currentOrigin;
    if (isRelative || isSameOrigin) {
      return url.pathname + url.search + url.hash;
    }
  } catch {}
  return "/";
}

function LoginInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams?.get("callbackUrl") ?? null;

  useEffect(() => {
    if (status === "authenticated") {
      const safe = sanitizeCallback(rawCallback, window.location.origin);
      router.replace(safe as Route);
    }
  }, [status, rawCallback, router]);

  return (
    <main className="mx-auto max-w-sm p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p className="mb-6">Sign in with Google to continue.</p>
      <button
        className="btn rounded-xl px-4 py-2 shadow"
        onClick={() => {
          const safe = sanitizeCallback(rawCallback, window.location.origin);
          void signIn("google", { callbackUrl: safe });
        }}
      >
        Continue with Google
      </button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-sm p-8 text-center">Loading…</main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
