"use client";

import { Loader2 } from "lucide-react";
import { motion, type MotionProps } from "framer-motion";
import Link from "next/link";
import { type Route } from "next";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  createContext,
  useContext,
  useState,
} from "react";

import { cn } from "@/lib/cn";

const pressableMotion: MotionProps = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 30, duration: 0.08 },
};

export function homeCardRowClassName(className?: string) {
  return cn(
    "group relative block w-full px-4 py-1 cursor-pointer select-none transition-all no-underline",
    "hover:bg-[var(--cream)]",
    "active:bg-[color-mix(in_srgb,var(--cream)_82%,var(--green)_18%)]",
    "data-[loading=true]:bg-[color-mix(in_srgb,var(--cream)_78%,var(--green)_22%)]",
    "data-[loading=true]:text-[color-mix(in_srgb,var(--green)_82%,var(--ink)_18%)]",
    "focus-visible:bg-[var(--cream)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]",
    "active:scale-[.97]",
    className,
  );
}

const PendingContext = createContext<{
  pendingHref: string | null;
  setPendingHref: (href: string) => void;
} | null>(null);

export function HomeCardRows({ children }: { children: ReactNode }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  return (
    <PendingContext.Provider value={{ pendingHref, setPendingHref }}>
      {children}
    </PendingContext.Provider>
  );
}

type HomeCardRowLinkProps = ComponentProps<typeof Link>;
type LinkHref = HomeCardRowLinkProps["href"];

function getHrefKey(href: LinkHref) {
  if (typeof href === "string") return href;
  if (typeof href.pathname === "string") return href.pathname;
  return String(href);
}

export function HomeCardRowLink({
  className,
  href,
  onClick,
  children,
  style,
  ...props
}: HomeCardRowLinkProps) {
  const router = useRouter();
  const pending = useContext(PendingContext);
  const hrefKey = getHrefKey(href);
  const isPending = pending?.pendingHref === hrefKey;
  const hasPending =
    pending?.pendingHref !== null && pending?.pendingHref !== undefined;
  const isInactive = hasPending && !isPending;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isPending || isInactive) {
      event.preventDefault();
      return;
    }
    pending?.setPendingHref(hrefKey);
    onClick?.(event);
    event.preventDefault();
    router.push(hrefKey as Route);
  };

  return (
    <motion.div {...pressableMotion} className="w-full">
      <Link
        {...props}
        href={href}
        onClick={handleClick}
        aria-busy={isPending || undefined}
        aria-disabled={isPending || isInactive || undefined}
        data-href={hrefKey}
        data-loading={isPending ? "true" : undefined}
        data-has-pending={hasPending ? "true" : undefined}
        data-inactive={isInactive ? "true" : undefined}
        style={{ textDecoration: "none", ...style }}
        className={homeCardRowClassName(
          cn(
            className,
            isInactive && "opacity-70 pointer-events-none",
            isPending && "shadow-inner",
          ),
        )}
        tabIndex={isInactive ? -1 : undefined}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function HomeCardRowSpinner() {
  return (
    <Loader2
      data-spinner
      aria-hidden
      className="h-4 w-4 shrink-0 text-[var(--green)] opacity-0 transition-opacity group-data-[loading=true]:opacity-100 group-data-[loading=true]:animate-spin"
    />
  );
}
