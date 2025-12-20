"use client";

import { Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { sanitizeCallback } from "@/lib/auth/sanitizeCallback";

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

export default function LoginClient() {
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
