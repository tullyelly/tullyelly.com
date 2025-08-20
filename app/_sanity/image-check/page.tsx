/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';

export const metadata = {
  title: 'Image Sanity Check',
};

export default function Page() {
  return (
    <article className="section" aria-labelledby="title">
      <h1 id="title">Image Sanity Check</h1>
      <p>Raw &lt;img&gt; below should match Next.js Image.</p>
      <img
        src="/images/optimized/cardattack.webp"
        width="1200"
        height="675"
        alt="raw control"
      />
      <Image
        src="/images/optimized/cardattack.webp"
        alt="next-image"
        width={1200}
        height={675}
      />
    </article>
  );
}
