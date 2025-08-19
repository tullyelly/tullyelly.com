import type { Metadata } from "next";
import Image from "next/image";


export const metadata: Metadata = {
title: "HEELS HAVE EYES",
description: "A shareable static page for HEELS HAVE EYES.",
openGraph: {
title: "HEELS HAVE EYES",
description: "A shareable static page for HEELS HAVE EYES.",
images: [
"/images/optimized/hero-heels-1200.webp",
],
},
};


export default function Page() {
return (
<article className="section" aria-labelledby="title">
<h1 id="title">HEELS HAVE EYES</h1>
<p>This page uses the same base layout, tokens, and image pipeline.</p>


<figure>
<Image
src="/img/test.webp"
alt="HEELS HAVE EYES hero"
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