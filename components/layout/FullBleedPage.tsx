import { cn } from "@/lib/utils";

export default function FullBleedPage({
  children,
  articleClassName,
  shellWidth = "default",
}: {
  children: React.ReactNode;
  articleClassName?: string;
  shellWidth?: "default" | "wide";
}) {
  return (
    <div
      className="-mx-2 md:mx-0"
      data-content-width={shellWidth === "wide" ? "wide" : undefined}
    >
      <article
        className={cn(
          "w-full max-w-none space-y-10 md:mx-auto md:max-w-3xl",
          articleClassName,
        )}
      >
        {children}
      </article>
    </div>
  );
}
