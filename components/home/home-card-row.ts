import { cn } from "@/lib/cn";

export function homeCardRowClassName(className?: string) {
  return cn(
    "block w-full px-4 py-1 transition-colors hover:bg-[var(--cream)] focus-visible:bg-[var(--cream)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
    className,
  );
}
