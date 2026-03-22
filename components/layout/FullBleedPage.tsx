import { cn } from "@/lib/utils";

export default function FullBleedPage({
  children,
  articleClassName,
}: {
  children: React.ReactNode;
  articleClassName?: string;
}) {
  return (
    <div className="-mx-2 md:mx-0">
      <article
        className={cn(
          "mt-8 w-full max-w-none space-y-10 md:mx-auto md:mt-10 md:max-w-3xl",
          articleClassName,
        )}
      >
        {children}
      </article>
    </div>
  );
}
