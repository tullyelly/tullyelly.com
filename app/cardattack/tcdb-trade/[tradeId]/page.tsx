import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { MdxRenderer } from "@/components/mdx-renderer";
import {
  ReleaseSectionColoursProvider,
  useNextRainbowColour,
} from "@/components/providers/ReleaseSectionColoursProvider";
import { fmtDate } from "@/lib/datetime";
import { compileMdxToCode } from "@/lib/mdx/compile";
import { getTcdbTradeSections, type TradeSection } from "@/lib/tcdb-trades";

type Params = { tradeId: string };

type RenderableSection = TradeSection & { code: string };
type ReleaseSectionProps = ComponentProps<typeof ReleaseSection>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RELEASE_SECTION_PATTERN = /<ReleaseSection\b/g;

const countReleaseSections = (source: string): number =>
  source.match(RELEASE_SECTION_PATTERN)?.length ?? 0;

function RainbowReleaseSection(props: ReleaseSectionProps) {
  const rainbowColour = useNextRainbowColour();
  return <ReleaseSection {...props} rainbowColour={rainbowColour} />;
}

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
  const totalReleaseSections = compiledSections.reduce(
    (total, section) => total + countReleaseSections(section.mdx),
    0,
  );

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
        <MdxRenderer
          code={section.code}
          components={{ ReleaseSection: RainbowReleaseSection }}
        />
        <Link href={section.postUrl} className="link-blue text-sm">
          View chronicle post
        </Link>
      </div>
    );
  };

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            {`TCDB Trade ${tradeId}`}
          </h1>
        </header>
        <ReleaseSectionColoursProvider totalSections={totalReleaseSections}>
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
        </ReleaseSectionColoursProvider>
      </Card>
    </FullBleedPage>
  );
}
