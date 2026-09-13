import { cn } from "@/lib/utils";

export type PageWidth = "reading" | "standard" | "wide";

const PAGE_WIDTH_CLASSES: Record<PageWidth, string> = {
  reading: "md:max-w-3xl",
  standard: "md:max-w-[var(--content-max)]",
  wide: "md:max-w-[76rem] xl:max-w-[82rem]",
};

export default function FullBleedPage({
  children,
  articleClassName,
  width = "reading",
}: {
  children: React.ReactNode;
  articleClassName?: string;
  width?: PageWidth;
}) {
  return (
    <div
      className="-mx-2 md:mx-0"
      data-content-width={width === "wide" ? "wide" : undefined}
    >
      <article
        className={cn(
          "w-full max-w-none space-y-10 md:mx-auto",
          PAGE_WIDTH_CLASSES[width],
          articleClassName,
        )}
      >
        {children}
      </article>
    </div>
  );
}
