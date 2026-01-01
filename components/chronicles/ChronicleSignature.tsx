import Link from "next/link";
import { fmtDate } from "@/lib/datetime";
import { PILL_BLUE, pillInteractionClasses } from "@/components/ui/pillStyles";

type ChronicleSignatureProps = {
  title: string;
  date: string;
  summary?: string;
  tags?: string[];
};

export function ChronicleSignature({
  title,
  date,
  summary,
  tags,
}: ChronicleSignatureProps) {
  const normalizedTags = tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-[16px] md:text-[18px] leading-relaxed text-muted-foreground">
        <Link href="/unclejimmy/hug-ball">Hug ball</Link>
      </p>
      <section className="border-t border-[var(--border-subtle)] pt-6 text-sm leading-snug text-muted-foreground">
        <p className="mt-0 mb-0 text-sm leading-snug text-muted-foreground">
          <span className="font-medium">
            &ldquo;{title}&rdquo;; {fmtDate(date)}.
          </span>
          {summary ? (
            <>
              <br />
              {summary}
            </>
          ) : null}
        </p>
        {normalizedTags.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {normalizedTags.map((tag) => {
              const tagSlug = encodeURIComponent(tag.toLowerCase());
              return (
                <Link
                  key={tag}
                  href={`/shaolin/tags/${tagSlug}`}
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold leading-none",
                    pillInteractionClasses,
                  ].join(" ")}
                  style={{
                    ["--tab-bg" as string]: PILL_BLUE,
                    textDecoration: "none",
                  }}
                  prefetch={false}
                >
                  #{tag.toLowerCase()}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
