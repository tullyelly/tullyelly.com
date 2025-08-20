import Image from 'next/image';

interface HeroProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  priority?: boolean;
}

export default function Hero({ src, alt, width, height, caption, priority = true }: HeroProps) {
  return (
    <figure>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, 1200px"
        priority={priority}
      />
      {caption && <figcaption className="muted">{caption}</figcaption>}
    </figure>
  );
}
