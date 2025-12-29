import type { ReactNode } from "react";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";

type Props = {
  alterEgo: string;
  children: ReactNode;
  divider?: boolean;
};

// ReleaseSection acts as a no-op wrapper for MDX content and optionally renders a
// divider after the block (Great Lakes blue hr from global MDX styles).
export default function ReleaseSection({
  alterEgo,
  children,
  divider = true,
}: Props) {
  return (
    <>
      <div className="space-y-3">
        {children}
        <div className="flex justify-end">
          <Badge className={getBadgeClass("planned")}>
            #{String(alterEgo)}
          </Badge>
        </div>
      </div>
      {divider ? (
        <hr className="my-10 h-[4px] w-full rounded border-0 bg-[var(--blue)]" />
      ) : null}
    </>
  );
}
