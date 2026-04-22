import Link from "next/link";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import FolderImageCarouselServer from "@/components/media/FolderImageCarousel.server";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import type { TcdbTradeNarrativeDay, TradeSection } from "@/lib/tcdb-trades";
import { cn } from "@/lib/utils";

type TradeChronicleDay = TcdbTradeNarrativeDay & { anchorId: string };

type Props = {
  days: TradeChronicleDay[];
  emptyMessage: string;
  missingContentMessage: string;
};

type RenderableTradeSection = TradeSection & { code: string };
type RenderableTradeDay = TradeChronicleDay & {
  compiledSections: RenderableTradeSection[];
};

const DAY_LABEL: Record<TradeChronicleDay["side"], string> = {
  sent: "Package Sent",
  received: "Package Received",
  archived: "Trade Archived",
};

const SIDE_STYLES: Record<
  TradeChronicleDay["side"],
  {
    chipClassName: string;
    sourceLinkClassName: string;
  }
> = {
  sent: {
    chipClassName:
      "bg-[color:var(--trade-rust)] text-[color:var(--trade-off-white)]",
    sourceLinkClassName:
      "text-[color:var(--trade-rust-deep)] hover:text-[color:var(--trade-rust)]",
  },
  received: {
    chipClassName:
      "bg-[color:var(--trade-blue)] text-[color:var(--trade-off-white)]",
    sourceLinkClassName:
      "text-[color:var(--trade-blue)] hover:text-[color:var(--trade-blue)]",
  },
  archived: {
    chipClassName:
      "bg-[color:var(--trade-charcoal)] text-[color:var(--trade-off-white)]",
    sourceLinkClassName:
      "text-[color:var(--trade-charcoal)] hover:text-[color:var(--trade-blue)]",
  },
};

const tradeNarrativeBodyClassName =
  "text-[16px] leading-8 text-[color:var(--trade-charcoal)]";

function TradeNarrativeSection({
  children,
  guestMage,
}: {
  children: ReactNode;
  guestMage?: string;
}) {
  return (
    <div className="space-y-4">
      {guestMage ? (
        <div className="inline-flex items-center rounded-full bg-[color:var(--trade-off-white)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--trade-charcoal)] shadow-sm ring-1 ring-[color:var(--trade-border)]">
          {`Guest Mage: ${guestMage}`}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function getSourcePostLabel(
  post: TradeChronicleDay["sourcePosts"][number],
): string {
  return post.title ?? fmtDate(post.date);
}

export default async function TcdbTradeChronicleFeed({
  days,
  emptyMessage,
  missingContentMessage,
}: Props) {
  const renderableDays: RenderableTradeDay[] = await Promise.all(
    days.map(async (day) => ({
      ...day,
      compiledSections: await Promise.all(
        day.sections.map(async (section) => ({
          ...section,
          code: await compileMdxToCode(section.mdx),
        })),
      ),
    })),
  );

  const tradeMdxComponents: MDXComponents = {
    ReleaseSection: TradeNarrativeSection,
    p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
      <p
        className={cn(
          tradeNarrativeBodyClassName,
          "mt-4 first:mt-0 last:mb-0",
          "[li_&]:mt-0 [li_&+p]:mt-0",
          "[li_&]:inline [li_&+p]:inline",
          "[li_&+p]:before:content-['\\00A0;\\00A0']",
          className,
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
      <h2
        className={cn(
          "mt-8 text-xl font-semibold leading-tight text-[color:var(--trade-charcoal)] md:text-2xl",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
      <h3
        className={cn(
          "mt-6 text-lg font-semibold leading-tight text-[color:var(--trade-charcoal)] md:text-xl",
          className,
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
      <ul
        className={cn(
          tradeNarrativeBodyClassName,
          "mt-4 list-disc space-y-2 pl-6 marker:text-[color:var(--mdx-marker-color)]",
          className,
        )}
        {...props}
      />
    ),
    ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
      <ol
        className={cn(
          tradeNarrativeBodyClassName,
          "mt-4 list-decimal space-y-2 pl-5 marker:text-[color:var(--mdx-marker-color)]",
          className,
        )}
        {...props}
      />
    ),
    blockquote: ({
      className,
      ...props
    }: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className={cn(
          tradeNarrativeBodyClassName,
          "mt-6 border-l-4 border-[color:var(--mdx-divider-color)] pl-4 italic",
          className,
        )}
        {...props}
      />
    ),
    hr: ({ className, ...props }: ComponentPropsWithoutRef<"hr">) => (
      <hr
        className={cn(
          "my-8 h-[4px] w-full rounded border-0 bg-[color:var(--mdx-divider-color)]",
          className,
        )}
        {...props}
      />
    ),
    img: ({
      className,
      alt,
      width,
      height,
      ...rest
    }: ComponentPropsWithoutRef<typeof Image>) => (
      <span className="mx-auto block w-full max-w-[30rem]">
        <Image
          alt={alt ?? ""}
          width={width ?? 1200}
          height={height ?? 630}
          className={cn("w-full rounded-2xl shadow-sm", className)}
          {...rest}
        />
      </span>
    ),
    FolderImageCarousel: (
      props: ComponentProps<typeof FolderImageCarouselServer>,
    ) => (
      <div className="mx-auto w-full max-w-[30rem]">
        <FolderImageCarouselServer {...props} />
      </div>
    ),
  };

  if (renderableDays.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--trade-charcoal)] opacity-80">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {renderableDays.map((day, dayIndex) => {
        const styles = SIDE_STYLES[day.side];

        return (
          <div key={`${day.tradeDate}-${day.side}`} className="space-y-0">
            {dayIndex > 0 ? (
              <div
                aria-hidden="true"
                className="my-8 h-[4px] w-full rounded bg-[color:var(--trade-rust)]"
              />
            ) : null}
            <article
              id={day.anchorId}
              className={cn(
                "space-y-4",
                dayIndex === renderableDays.length - 1 && "pb-8",
              )}
            >
              <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="inline-flex min-h-[2.25rem] items-center whitespace-nowrap text-sm font-semibold leading-none text-[color:var(--trade-charcoal)]">
                    <time dateTime={day.tradeDate} className="relative top-px">
                      {fmtDate(day.tradeDate, "America/Chicago", "long")}
                    </time>
                  </div>

                  {day.sourcePosts.length > 0 ? (
                    <nav
                      aria-label={`${fmtDate(day.tradeDate)} source posts`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                    >
                      {day.sourcePosts.map((post) => (
                        <Link
                          key={`${day.tradeDate}-${post.slug}`}
                          href={post.url}
                          className={cn(
                            "inline-flex min-h-[2.25rem] items-center whitespace-nowrap font-medium leading-none transition",
                            styles.sourceLinkClassName,
                          )}
                        >
                          {`Chronicle: ${getSourcePostLabel(post)}`}
                        </Link>
                      ))}
                    </nav>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "ml-auto inline-flex items-center rounded-full border border-transparent px-3 py-1.5 text-sm font-semibold leading-snug",
                    styles.chipClassName,
                  )}
                >
                  {DAY_LABEL[day.side]}
                </span>
              </header>

              <div className="min-w-0 space-y-8">
                {day.compiledSections.length > 0 ? (
                  day.compiledSections.map((section, sectionIndex) => (
                    <div
                      key={`${day.tradeDate}-${section.postSlug}-${section.mdx}`}
                      className={cn(
                        "space-y-4",
                        sectionIndex > 0 &&
                          "border-t border-[color:var(--trade-border)] pt-8",
                      )}
                      style={{
                        ["--mdx-divider-color" as string]:
                          day.side === "received"
                            ? "var(--trade-blue)"
                            : day.side === "archived"
                              ? "var(--trade-charcoal)"
                              : "var(--trade-rust)",
                        ["--mdx-marker-color" as string]:
                          day.side === "received"
                            ? "var(--trade-blue)"
                            : day.side === "archived"
                              ? "var(--trade-charcoal)"
                              : "var(--trade-rust)",
                      }}
                    >
                      <ChronicleSectionMdxRenderer
                        code={section.code}
                        postDate={section.postDate}
                        components={tradeMdxComponents}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[color:var(--trade-charcoal)] opacity-80">
                    {missingContentMessage}
                  </p>
                )}
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
