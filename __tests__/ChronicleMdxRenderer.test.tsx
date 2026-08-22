import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

const releaseSectionMock = jest.fn(
  ({ children }: { children?: ReactNode; sectionOrdinal?: number }) => (
    <div data-testid="release-section">{children}</div>
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

import { ChronicleMdxRenderer } from "@/components/chronicles/ChronicleMdxRenderer";

describe("ChronicleMdxRenderer", () => {
  beforeEach(() => {
    chronicleSectionMdxRendererMock.mockClear();
    releaseSectionMock.mockClear();
  });

  it("assigns ReleaseSection anchors from the same source-order counter as rainbow colours", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
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
});
