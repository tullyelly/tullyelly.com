import type { Metadata } from "next";
import Image from "next/image";


export const metadata: Metadata = {
title: "Roadwork Rappin’",
description: "A shareable static page for Roadwork Rappin’.",
openGraph: {
title: "Roadwork Rappin’",
description: "A shareable static page for Roadwork Rappin’.",
images: [
"/images/optimized/hero-roadwork-1200.webp",
],
},
};


export default function Page() {
return (
<article className="section" aria-labelledby="title">
<h1 id="title">Roadwork Rappin’</h1>
<p>This page verifies our base layout, tokens, and image pipeline in Next.js.</p>


<figure>
<Image
src="/images/optimized/hero-roadwork-1200.webp"
alt="Roadwork Rappin’ hero"
width={1200}
height={675}
sizes="(max-width: 768px) 100vw, 1200px"
priority
/>
<figcaption className="muted">Hero image served from the optimized folder.</figcaption>
</figure>
</article>
);
}