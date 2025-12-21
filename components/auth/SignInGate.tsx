"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { signIn, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type SignInGateProps = {
  children: ReactNode;
  ctaText?: string;
  align?: "start" | "center" | "end";
  className?: string;
};

const ALIGN_CLASS: Record<NonNullable<SignInGateProps["align"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

export function SignInGate({
  children,
  ctaText = "Sign in",
  align = "start",
  className,
}: SignInGateProps) {
  const { status } = useSession();
  const [callbackUrl, setCallbackUrl] = useState("/");

  useEffect(() => {
    setCallbackUrl(window.location.href);
  }, []);

  const wrapperClass = useMemo(
    () => cn("flex", ALIGN_CLASS[align], className),
    [align, className],
  );

  const handleSignIn = useCallback(() => {
    void signIn("google", { callbackUrl });
  }, [callbackUrl]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className={wrapperClass}>
        <div
          className="h-10 min-w-[120px] rounded-full bg-black/10"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        onClick={handleSignIn}
        className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-full border border-[color:var(--blue)] bg-[color:var(--blue)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--blue-contrast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue-contrast)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {ctaText}
      </button>
    </div>
  );
}
