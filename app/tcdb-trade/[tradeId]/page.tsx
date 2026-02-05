import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import { MdxRenderer } from "@/components/mdx-renderer";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { getTcdbTradeSections, type TradeSection } from "@/lib/tcdb-trades";

type Params = { tradeId: string };

type RenderableSection = TradeSection & { code: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tradeId } = await params;
  const sections = getTcdbTradeSections(tradeId);

  if (sections.length === 0) {
    notFound();
  }

  const compiledSections: RenderableSection[] = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      code: await compileMdxToCode(section.mdx),
    })),
  );

  const hasOriginal = sections.some((section) => section.kind === "original");
  const hasCompleted = sections.some((section) => section.kind === "completed");

  return (
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="p-6 md:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {`TCDB Trade ${tradeId}`}
          </h1>
        </header>
        <div className="space-y-10">
          {compiledSections.map((section) => {
            const label =
              section.kind === "completed"
                ? "Package Received"
                : "Package Sent";
            return (
              <section
                key={`${section.kind}-${section.postSlug}`}
                className="space-y-4"
              >
                <h2 className="text-xl md:text-2xl font-semibold leading-tight">
                  {fmtDate(section.postDate)}:{" "}
                  <Link href={section.postUrl} className="link-blue">
                    {label}
                  </Link>
                </h2>
                <MdxRenderer code={section.code} />
                <Link href={section.postUrl} className="link-blue text-sm">
                  View chronicle post
                </Link>
              </section>
            );
          })}
          {!hasOriginal ? (
            <p className="text-sm text-muted-foreground">
              Original trade section not found.
            </p>
          ) : null}
          {!hasCompleted ? (
            <p className="text-sm text-muted-foreground">
              Completed trade section not found.
            </p>
          ) : null}
        </div>
      </Card>
    </article>
  );
}
