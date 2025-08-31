"use client";

import { Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

// Accept undefined to keep TS happy; keep redirects same-origin
function sanitizeCallback(raw?: string | null): string {
  if (!raw) return "/";
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(raw, base);
    if (typeof window === "undefined" || url.origin === base) {
      return url.pathname + url.search + url.hash;
    }
  } catch {}
  return "/";
}

function LoginInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Simple derive (no memo needed → no exhaustive-deps warnings)
  const callbackUrl = sanitizeCallback(searchParams?.get("callbackUrl") ?? null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  return (
    <main className="mx-auto max-w-sm p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p className="mb-6">Sign in with Google to continue.</p>
      <button
        className="rounded-xl px-4 py-2 shadow"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-sm p-8 text-center">Loading…</main>}>
      <LoginInner />
    </Suspense>
  );
}