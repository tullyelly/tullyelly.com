import type { ReactNode } from "react";

import { Card } from "@ui";
import { cn } from "@/lib/utils";
import FullBleedPage from "./FullBleedPage";

type DataPageShellProps = {
  children: ReactNode;
  width?: "standard" | "wide";
  articleClassName?: string;
  className?: string;
  contentClassName?: string;
};

export default function DataPageShell({
  children,
  width = "standard",
  articleClassName,
  className,
  contentClassName,
}: DataPageShellProps) {
  return (
    <FullBleedPage
      shellWidth={width === "wide" ? "wide" : "default"}
      articleClassName={cn(
        width === "wide"
          ? "md:max-w-[76rem] xl:max-w-[82rem]"
          : "md:max-w-[var(--content-max)]",
        articleClassName,
      )}
    >
      <Card
        as="div"
        className={cn(
          "border-0 px-1 pb-6 pt-0 shadow-none md:px-8 md:pb-8",
          className,
        )}
      >
        <div className={cn("space-y-8", contentClassName)}>{children}</div>
      </Card>
    </FullBleedPage>
  );
}
