import type { ReactNode } from "react";

import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { getScroll } from "@/lib/scrolls";

type Props = {
  alterEgo: string;
  children: ReactNode;
  divider?: boolean;
  releaseId?: string;
};

// ReleaseSection acts as a no-op wrapper for MDX content and optionally renders a
// divider after the block (Great Lakes blue hr from global MDX styles).
export default async function ReleaseSection({
  alterEgo,
  children,
  divider = true,
  releaseId,
}: Props) {
  let releaseName: string | undefined;
  let releaseType: string | undefined;

  if (releaseId) {
    const release = await getScroll(releaseId);
    releaseName = release?.release_name;
    releaseType = release?.release_type;
  }

  return (
    <>
      <div
        className="space-y-3"
        data-release-name={releaseName ?? undefined}
        data-release-type={releaseType ?? undefined}
      >
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
