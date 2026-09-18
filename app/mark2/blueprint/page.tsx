import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";

export const dynamic = "force-static";

const pageTitle = "mark2 blueprint landing | tullyelly";
const pageDescription =
  "Blueprint landing page for mark2; validates breadcrumb handling when marketing routes alias deeper structures.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("mark2/blueprint") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title: pageTitle,
    description: pageDescription,
    url: "/mark2/blueprint",
    type: "website",
  },
  twitter: {
    ...SHARED_TWITTER_FIELDS,
    title: pageTitle,
    description: pageDescription,
  },
};

export default function Mark2BlueprintLanding() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-mono">mark2: blueprint</h1>
        <p className="text-base text-muted-foreground">
          A quick landing page to verify breadcrumb interactions across nested
          routes.
        </p>
      </header>
      <section className="space-y-3">
        <p className="leading-relaxed">
          When this route is active, breadcrumbs should resolve to the mark2
          section without introducing an extra blueprint crumb. This mirrors the
          behaviour we want for marketing landing pages that alias deeper paths.
        </p>
      </section>
    </main>
  );
}
