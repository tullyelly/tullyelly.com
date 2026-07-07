import type { ReactNode } from "react";

export default function TcdbCardHistorySummary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase leading-tight text-[color:var(--trade-rust-deep)] opacity-80 md:text-[0.72rem]">
        <span className="normal-case">TCDb</span> CARD HISTORY
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
