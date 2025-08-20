export interface PageFrontmatter {
  title: string;
  description: string;
  canonical?: string;
  category?: 'music' | 'video' | 'campaign';
  hero: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  cta?: {
    label: string;
    href: string;
  };
  tags?: string[];
}
