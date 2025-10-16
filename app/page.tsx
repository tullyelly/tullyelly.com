export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { setBreadcrumb, type Crumb } from "@/lib/breadcrumb-registry";

const BREADCRUMB = [{ label: "home" }] satisfies ReadonlyArray<Crumb>;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  setBreadcrumb(BREADCRUMB);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl md:text-4xl font-semibold font-mono">
        ]construction in progress[
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Fresh digs are on the way; hang tight while the blog takes shape right
        here.
      </p>
    </section>
  );
}
