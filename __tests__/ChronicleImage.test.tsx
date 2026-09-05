import { render, screen } from "@testing-library/react";

const mdxImageMock = jest.fn(({ src, alt }: { src: string; alt: string }) => (
  <div data-testid="resolved-image" data-src={src} data-alt={alt} />
));
jest.mock("@/mdx-components", () => ({
  MdxImage: (props: { src: string; alt: string }) => mdxImageMock(props),
}));

import ChronicleImage, {
  resolveChronicleImageSource,
} from "@/components/chronicles/ChronicleImage";

describe("ChronicleImage", () => {
  beforeEach(() => mdxImageMock.mockClear());

  it("resolves an existing relative image through its Chronicle slug", () => {
    render(
      <ChronicleImage
        chronicleSlug="3am"
        src="964402/1-964402.webp"
        alt="Trade cards"
      />,
    );
    expect(screen.getByTestId("resolved-image")).toHaveAttribute(
      "data-src",
      "/images/optimus/3am/964402/1-964402.webp",
    );
  });

  it("uses the standardized administrator message for missing images", () => {
    render(
      <ChronicleImage
        chronicleSlug="tcdb-partners"
        src="1091638.webp"
        alt="1091638"
      />,
    );
    expect(
      screen.getByText(
        "Image unavailable: 1091638. Please contact the site administrator.",
      ),
    ).toBeInTheDocument();
    expect(mdxImageMock).not.toHaveBeenCalled();
  });

  it("rejects unsafe relative paths without throwing", () => {
    expect(
      resolveChronicleImageSource("tcdb-partners", "../x.webp"),
    ).toBeNull();
  });
});
