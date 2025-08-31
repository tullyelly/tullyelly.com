"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

// keep users on your own origin; fall back to "/"
function sanitizeCallback(raw: string | null): string {
  if (!raw) return "/";
  try {
    const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    // only allow same-origin redirects (prevents open-redirect shenanigans)
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // ignore bad URLs
  }
  return "/";
}

export default function LoginPage() {
  const { status } = useSession(); // 'loading' | 'authenticated' | 'unauthenticated'
  const router = useRouter();
  const searchParams = useSearchParams(); // ReadonlyURLSearchParams | null in your typings

  // Where to go after login (safe & typed)
  const callbackUrl = useMemo(
    () => sanitizeCallback(searchParams?.get("callbackUrl") ?? null),
    [searchParams]
  );

  // If already signed in, bounce immediately
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