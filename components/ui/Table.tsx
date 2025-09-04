import * as React from "react";
type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5">
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

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-white">
      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-ink/80 border-b border-black/10">
        {children}
      </tr>
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3 text-ink">{children}</tbody>;
}
