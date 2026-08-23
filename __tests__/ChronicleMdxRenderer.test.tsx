import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

const releaseSectionMock = jest.fn(
  ({ children }: { children?: ReactNode; sectionOrdinal?: number }) => (
    <div data-testid="release-section">{children}</div>
  ),
);
const mdxImageMock = jest.fn(({ src }: { src: string }) => (
  <div data-testid="resolved-image" data-src={src} />
));
const folderImageCarouselMock = jest.fn(
  ({ folder }: { folder: string; altPrefix?: string }) => (
    <div data-testid="folder-image-carousel">{folder}</div>
  ),
);

const chronicleSectionMdxRendererMock = jest.fn(
  ({
    code,
  }: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
    tagMetadataBySlug?: ReadonlyMap<string, unknown>;
  }) => <div data-testid="chronicle-section-mdx-renderer">{code}</div>,
);

jest.mock("@/components/chronicles/ChronicleSectionMdxRenderer", () => ({
  ChronicleSectionMdxRenderer: (props: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
    tagMetadataBySlug?: ReadonlyMap<string, unknown>;
  }) => chronicleSectionMdxRendererMock(props),
}));
jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: (props: { children?: ReactNode; sectionOrdinal?: number }) =>
    releaseSectionMock(props),
}));
jest.mock("@/components/media/FolderImageCarousel.server", () => ({
  __esModule: true,
  default: (props: { folder: string; altPrefix?: string }) =>
    folderImageCarouselMock(props),
}));
jest.mock("@/mdx-components", () => ({
  MdxImage: (props: { src: string }) => mdxImageMock(props),
}));

import { ChronicleMdxRenderer } from "@/components/chronicles/ChronicleMdxRenderer";

describe("ChronicleMdxRenderer", () => {
  beforeEach(() => {
    chronicleSectionMdxRendererMock.mockClear();
    releaseSectionMock.mockClear();
    mdxImageMock.mockClear();
    folderImageCarouselMock.mockClear();
  });

  it("assigns ReleaseSection anchors from the same source-order counter as rainbow colours", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        slug="test-chronicle"
        postDate="2026-04-10"
        source={
          '<ReleaseSection alterEgo="mark2">One</ReleaseSection><ReleaseSection alterEgo="cardattack">Two</ReleaseSection>'
        }
      />,
    );

    const props = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | { components?: Record<string, unknown> }
      | undefined;
    const WrappedReleaseSection = props?.components?.ReleaseSection as
      | ComponentType<{ alterEgo: string; children: ReactNode }>
      | undefined;

    expect(WrappedReleaseSection).toBeDefined();
    if (!WrappedReleaseSection)
      throw new Error("Expected ReleaseSection override");

    render(<WrappedReleaseSection alterEgo="mark2">One</WrappedReleaseSection>);
    render(
      <WrappedReleaseSection alterEgo="cardattack">Two</WrappedReleaseSection>,
    );

    expect(
      releaseSectionMock.mock.calls.map(
        ([callProps]) => callProps.sectionOrdinal,
      ),
    ).toEqual([1, 2]);
  });

  it("passes the post date and release section override to the shared chronicle section renderer", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        slug="test-chronicle"
        postDate="2026-04-10"
        source={'<TcdbSnapshot tag="shaq" />'}
      />,
    );

    const props = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | {
          components?: Record<string, unknown>;
          tagMetadataBySlug?: ReadonlyMap<string, unknown>;
        }
      | undefined;

    expect(props).toMatchObject({
      code: "compiled-mdx",
      postDate: "2026-04-10",
    });
    expect(props?.tagMetadataBySlug).toBeUndefined();
    expect(props?.components?.ReleaseSection).toBeDefined();
  });

  it("routes PersonTag through resolved tag metadata while preserving fallback behavior", () => {
    const tagMetadataBySlug = new Map([
      [
        "freak",
        {
          slug: "freak",
          displayName: "giannis antetokounmpo",
          href: "/cardattack/homies/freak",
          hrefKind: "homie" as const,
          isClickable: true,
          meta: {},
        },
      ],
    ]);

    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        slug="test-chronicle"
        postDate="2026-04-10"
        source={'<PersonTag tag="freak" />'}
        tagMetadataBySlug={tagMetadataBySlug}
      />,
    );

    const props = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | {
          components?: Record<string, unknown>;
          tagMetadataBySlug?: ReadonlyMap<string, unknown>;
        }
      | undefined;
    const RoutedPersonTag = props?.components?.PersonTag as
      | ComponentType<{ tag: string; href?: string }>
      | undefined;

    expect(RoutedPersonTag).toBeDefined();
    expect(props?.tagMetadataBySlug).toBe(tagMetadataBySlug);
    if (!RoutedPersonTag) {
      throw new Error(
        "Expected PersonTag to be routed in ChronicleMdxRenderer",
      );
    }

    render(<RoutedPersonTag tag="freak" />);
    render(<RoutedPersonTag tag="lulu" />);
    render(<RoutedPersonTag tag="freak" href="/custom-route" />);

    const freakLinks = screen.getAllByRole("link", { name: "freak" });
    expect(freakLinks[0]).toHaveAttribute("href", "/cardattack/homies/freak");
    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "href",
      "/unclejimmy/squad/lulu",
    );
    expect(freakLinks[1]).toHaveAttribute("href", "/custom-route");
  });

  it("routes the Chronicle slug through the Markdown image resolver", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        slug="vomitspit"
        postDate="2026-04-10"
        source="![fern](fern.webp)"
      />,
    );

    const props = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | { components?: Record<string, unknown> }
      | undefined;
    const ChronicleImage = props?.components?.img as
      | ComponentType<{ src: string; alt: string }>
      | undefined;

    expect(ChronicleImage).toBeDefined();
    if (!ChronicleImage) throw new Error("Expected Chronicle image override");

    render(<ChronicleImage src="fern.webp" alt="fern" />);
    expect(mdxImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        src: "/images/optimus/vomitspit/fern.webp",
      }),
    );
  });

  it("resolves relative, root, and existing Chronicle carousel folders", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        slug="rye"
        postDate="2026-04-10"
        source='<FolderImageCarousel folder="faith" />'
      />,
    );

    const props = chronicleSectionMdxRendererMock.mock.calls[0]?.[0] as
      | { components?: Record<string, unknown> }
      | undefined;
    const ChronicleCarousel = props?.components?.FolderImageCarousel as
      | ComponentType<{ folder?: string }>
      | undefined;

    expect(ChronicleCarousel).toBeDefined();
    if (!ChronicleCarousel) {
      throw new Error("Expected Chronicle FolderImageCarousel override");
    }

    render(<ChronicleCarousel folder="faith" />);
    render(<ChronicleCarousel />);
    render(<ChronicleCarousel folder="rye/faith" />);

    expect(
      folderImageCarouselMock.mock.calls.map(([callProps]) => callProps.folder),
    ).toEqual(["rye/faith", "rye", "rye/faith"]);
  });
});
