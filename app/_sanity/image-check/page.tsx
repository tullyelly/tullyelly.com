/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { notFound } from "next/navigation";
import { isImageSanityCheckEnabled } from "@/lib/escape-hatches";

export const metadata = {
  title: "Image Sanity Check",
};

export default function Page() {
  if (!isImageSanityCheckEnabled()) {
    notFound();
  }

  return (
    <article className="section" aria-labelledby="title">
      <h1 id="title">Image Sanity Check</h1>
      <p>Raw &lt;img&gt; below should match Next.js Image.</p>
      <img
        src="/images/optimus/cardattack.webp"
        width="1200"
        height="675"
        alt="raw control"
      />
      <Image
        src="/images/optimus/cardattack.webp"
        alt="next-image"
        width={1200}
        height={675}
      />
    </article>
  );
}
