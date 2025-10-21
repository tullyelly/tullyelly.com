export type OgImageInput =
  | { url: string; alt?: string; width?: number; height?: number }
  | null
  | undefined;

export type TwitterCardType = "summary" | "summary_large_image";

export type SeoInput = {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article" | "profile" | "book" | "music.song";
  robots?: { index?: boolean; follow?: boolean };
  // image-ready future (not used yet)
  ogImage?: OgImageInput;
  twitterCard?: TwitterCardType; // defaults to "summary" unless an image is present later
  // optional structured data object
  jsonld?: Record<string, unknown>;
};

export type CanonicalFactory = (path: string, search?: string) => string;

export type PageFrontmatter = {
  title: string;
  summary: string;
  slug?: string;
  published?: boolean;
  date?: string; // ISO
  updated?: string; // ISO
  tags?: string[];
  author?: string;
  // tomorrow: hero/social image fields can be added here without refactors
  hero?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
};
