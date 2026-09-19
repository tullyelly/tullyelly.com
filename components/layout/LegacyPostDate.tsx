import type { ReactNode } from "react";

type LegacyPostDateProps = {
  date: string;
  children: ReactNode;
};

export default function LegacyPostDate({
  date,
  children,
}: LegacyPostDateProps) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium uppercase tracking-wide text-ink/60">
        Originally posted
      </span>{" "}
      <time dateTime={date}>{children}</time>
    </p>
  );
}
