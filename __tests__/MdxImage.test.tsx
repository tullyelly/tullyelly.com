import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import type { ImageSlide } from "@/lib/images/image-slide";
import manifest from "@/lib/images/optimus-images-manifest.json";

const interactiveImageMock = jest.fn(
  ({ children }: { slide: ImageSlide; children: ReactNode }) => (
    <span data-testid="interactive-image">{children}</span>
  ),
);

jest.mock("@/components/media/InteractiveImage", () => ({
  __esModule: true,
  default: (props: { slide: ImageSlide; children: ReactNode }) =>
    interactiveImageMock(props),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} data-next-image="true" />
  ),
}));

jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/SetCollector", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/YouTubeMusicPlaylist", () => ({
  __esModule: true,
  default: () => null,
}));

import { MdxImage } from "@/mdx-components";

describe("MdxImage", () => {
  beforeEach(() => interactiveImageMock.mockClear());

  it("uses the optimized image's natural dimensions in both the preview and viewer slide", () => {
    const portrait = manifest.images.find(
      (image) => image.height > image.width,
    );
    if (!portrait) throw new Error("Expected a portrait image in the manifest");

    render(
      <MdxImage
        src={portrait.src}
        alt="Portrait artwork"
        className="custom-image"
      />,
    );

    const image = screen.getByRole("img", { name: "Portrait artwork" });
    expect(image).toHaveAttribute("width", String(portrait.width));
    expect(image).toHaveAttribute("height", String(portrait.height));
    expect(image).toHaveAttribute("data-next-image", "true");
    expect(image).toHaveClass("custom-image");
    const maxWidth = Math.min(
      portrait.width,
      Math.round((720 * portrait.width) / portrait.height),
    );
    expect(image).toHaveAttribute(
      "sizes",
      `(max-width: 768px) 100vw, ${Math.min(maxWidth, 1152)}px`,
    );
    expect(image.parentElement?.parentElement).toHaveStyle({
      maxWidth: `${maxWidth}px`,
    });
    expect(interactiveImageMock.mock.calls[0][0].slide).toEqual({
      src: portrait.src,
      alt: "Portrait artwork",
      width: portrait.width,
      height: portrait.height,
    });
  });

  it("preserves explicit author dimensions and alternative text", () => {
    const src = "/images/optimus/custom-dimensions.webp";
    render(<MdxImage src={src} alt="Card scan" width="480" height="720" />);

    const image = screen.getByRole("img", { name: "Card scan" });
    expect(image).toHaveAttribute("width", "480");
    expect(image).toHaveAttribute("height", "720");
    expect(interactiveImageMock.mock.calls[0][0].slide).toEqual({
      src,
      alt: "Card scan",
      width: 480,
      height: 720,
    });
  });

  it("uses a natural image without invented dimensions when metadata is unavailable", () => {
    const src = "https://images.example.test/unknown-portrait.webp";
    render(
      <MdxImage src={src} alt="External artwork" title="Original artwork" />,
    );

    const image = screen.getByRole("img", { name: "External artwork" });
    expect(image).toHaveAttribute("src", src);
    expect(image).toHaveAttribute("title", "Original artwork");
    expect(image).not.toHaveAttribute("data-next-image");
    expect(image).not.toHaveAttribute("width");
    expect(image).not.toHaveAttribute("height");
    expect(image.parentElement?.parentElement).toHaveStyle({
      maxWidth: "720px",
    });
    expect(interactiveImageMock.mock.calls[0][0].slide).toMatchObject({
      src,
      alt: "External artwork",
    });
    expect(interactiveImageMock.mock.calls[0][0].slide.width).toBeUndefined();
    expect(interactiveImageMock.mock.calls[0][0].slide.height).toBeUndefined();
  });

  it("uses static import dimensions while passing its source URL into the viewer", () => {
    const staticImage = {
      src: "/_next/static/media/card.webp",
      width: 600,
      height: 900,
    };
    render(<MdxImage src={staticImage} alt="Imported card" />);

    expect(interactiveImageMock.mock.calls[0][0].slide).toEqual({
      ...staticImage,
      alt: "Imported card",
    });
    expect(screen.getByRole("img", { name: "Imported card" })).toHaveAttribute(
      "width",
      "600",
    );
    expect(screen.getByRole("img", { name: "Imported card" })).toHaveAttribute(
      "height",
      "900",
    );
  });
});
