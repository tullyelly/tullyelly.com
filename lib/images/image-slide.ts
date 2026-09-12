/** Serializable image data shared by inline previews and the image viewer. */
export type ImageSlide = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};
