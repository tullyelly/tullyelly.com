export interface Hero {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface PageFrontmatter {
  title: string;
  description: string;
  canonical?: string;
  category?: 'music' | 'video' | 'campaign';
  hero?: Hero;
  cta?: {
    label: string;
    href: string;
  };
  tags?: string[];
}
