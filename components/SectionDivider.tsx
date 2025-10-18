import { cn } from "@/app/lib/cn";

type Props = {
  className?: string;
};

export function SectionDivider({ className }: Props) {
  return (
    // Using a block with background color avoids any Preflight hr inheritance
    // and guarantees the exact brand color shows.
    <div
      aria-hidden
      className={cn(
        // Force Great Lakes Blue via CSS var; avoid Tailwind color mapping pitfalls
        "my-10 h-[4px] w-full rounded bg-[var(--blue)]",
        className,
      )}
    />
  );
}
