import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tradeId } = await params;
  return {
    title: `TCDB Trade ${tradeId}`,
    description: "Original + completed trade log pulled from chronicles.",
    robots: { index: true },
  };
}

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

  const originals = compiledSections.filter(
    (section) => section.kind === "original",
  );
  const completeds = compiledSections.filter(
    (section) => section.kind === "completed",
  );
  const hasOriginal = originals.length > 0;
  const hasCompleted = completeds.length > 0;
  const hasBoth = hasOriginal && hasCompleted;

  const renderSection = (section: RenderableSection, index: number) => {
    const label =
      section.kind === "completed" ? "Package Received" : "Package Sent";
    return (
      <div
        key={`${section.kind}-${section.postSlug}-${section.postDate}-${index}`}
        id={section.kind}
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
      </div>
    );
  };

  return (
    <article className="max-w-3xl mx-auto space-y-10 mt-8 md:mt-10">
      <Card as="section" className="p-6 md:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {`TCDB Trade ${tradeId}`}
          </h1>
        </header>
        <div className="space-y-10">
          {hasBoth ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="#original" className="link-blue">
                Jump to Package Sent
              </Link>
              <Link href="#completed" className="link-blue">
                Jump to Package Received
              </Link>
            </div>
          ) : null}
          {hasOriginal ? (
            <div className="space-y-10">{originals.map(renderSection)}</div>
          ) : null}
          {hasCompleted ? (
            <div className="space-y-10">{completeds.map(renderSection)}</div>
          ) : null}
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
