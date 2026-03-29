import { cn } from "@/lib/utils";

type PageIntroProps = {
  title: React.ReactNode;
  children?: React.ReactNode;
  accessory?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
};

export default function PageIntro({
  title,
  children,
  accessory,
  actions,
  className,
  contentClassName,
  headerClassName,
  titleClassName,
}: PageIntroProps) {
  const hasHeaderLayout = accessory || actions;

  return (
    <div className={cn("space-y-4", className)}>
      <header
        className={cn(
          hasHeaderLayout
            ? "flex flex-wrap items-center justify-between gap-3"
            : undefined,
          headerClassName,
        )}
      >
        {hasHeaderLayout ? (
          <>
            <div className="flex items-center gap-3">
              <h1
                className={cn(
                  "text-3xl font-semibold leading-tight md:text-4xl",
                  titleClassName,
                )}
              >
                {title}
              </h1>
              {accessory}
            </div>
            {actions}
          </>
        ) : (
          <h1
            className={cn(
              "text-3xl font-semibold leading-tight md:text-4xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
        )}
      </header>
      {children ? (
        <div className={cn("space-y-4", contentClassName)}>{children}</div>
      ) : null}
    </div>
  );
}
