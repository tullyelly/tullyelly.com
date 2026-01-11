import * as React from "react";
type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  variant?: "default" | "bucks"; // controls outer frame styling
  showOnMobile?: boolean;
};

export function Table({
  className,
  children,
  variant = "default",
  showOnMobile = false,
  ...rest
}: TableProps) {
  const frameClass =
    variant === "bucks"
      ? "overflow-x-auto rounded-2xl border-2 border-[var(--green)] shadow-sm ring-0 overflow-hidden"
      : "overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5";
  const displayClass = showOnMobile ? "block" : "hidden md:block";
  return (
    <div className={displayClass} suppressHydrationWarning>
      <div className={frameClass}>
        <table
          className={`w-full table-fixed border-collapse zebra-desktop text-sm leading-6${className ? ` ${className}` : ""}`}
          {...rest}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

type THeadProps = { children: React.ReactNode; variant?: "default" | "bucks" };

export function THead({ children, variant = "default" }: THeadProps) {
  const theadClass = variant === "bucks" ? "bg-[var(--green)]" : "bg-white";
  const thColor =
    variant === "bucks" ? "[&>th]:text-white" : "[&>th]:text-ink/80";
  return (
    <thead className={theadClass}>
      <tr
        className={`[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold ${thColor} border-b border-black/10`}
      >
        {children}
      </tr>
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3 text-ink">{children}</tbody>
  );
}
