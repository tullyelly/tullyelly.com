"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { sanitizeCallback } from "@/lib/auth/sanitizeCallback";
import { cn } from "@/lib/utils";

function buildDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/)[0] || "User";
  }
  if (email && email.includes("@")) {
    const local = email.split("@")[0] || "";
    if (local) {
      return local;
    }
  }
  return "User";
}

function buildInitials(displayName: string): string {
  if (!displayName) return "U";
  if (displayName === "User") return "U";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function useSafeCallbackUrl(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";

  return useMemo(() => {
    const origin =
      globalThis.location?.origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const href =
      globalThis.location?.href ??
      (origin
        ? `${origin}${pathname ?? ""}${searchKey ? `?${searchKey}` : ""}`
        : "/");
    return sanitizeCallback(href, origin || undefined);
  }, [pathname, searchKey]);
}

function LoadingPlaceholder() {
  return (
    <div
      className="h-9 min-w-[96px] rounded-full bg-white/15"
      aria-hidden="true"
    />
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold uppercase leading-none">
      {initials}
    </span>
  );
}

export default function HeaderUser() {
  const { data, status } = useSession();
  const callbackUrl = useSafeCallbackUrl();
  const displayName = useMemo(
    () => buildDisplayName(data?.user?.name, data?.user?.email),
    [data?.user?.name, data?.user?.email],
  );
  const initials = useMemo(() => buildInitials(displayName), [displayName]);

  const handleSignIn = useCallback(() => {
    void signIn("google", { callbackUrl });
  }, [callbackUrl]);

  const handleSignOut = useCallback(() => {
    void signOut({ callbackUrl });
  }, [callbackUrl]);

  const itemClass =
    "profile-menu-item focus-visible:outline-none focus-visible:ring-0";

  if (status === "loading") {
    return <LoadingPlaceholder />;
  }

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-full border border-white/40 px-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        onClick={handleSignIn}
      >
        Sign in
      </button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-10 min-w-[120px] items-center justify-start gap-2 rounded-full border border-white/35 bg-white/10 px-2.5 text-sm font-semibold text-white shadow-sm",
            "transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          )}
          aria-label="Open user menu"
        >
          <Avatar initials={initials} />
          <span className="truncate pr-1">{displayName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="profile-menu-surface w-64 p-3 text-ink"
      >
        <div className="profile-menu-list">
          <Link
            href="/profile"
            className={cn(
              itemClass,
              "inline-flex items-center justify-start text-left",
            )}
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              itemClass,
              "inline-flex items-center justify-start text-left font-medium",
            )}
          >
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
