import { render } from "@testing-library/react";
import type { ReactNode } from "react";

const chronicleSectionMdxRendererMock = jest.fn(
  ({
    code,
  }: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => <div data-testid="chronicle-section-mdx-renderer">{code}</div>,
);

jest.mock("@/components/chronicles/ChronicleSectionMdxRenderer", () => ({
  ChronicleSectionMdxRenderer: (props: {
    code: string;
    postDate: string;
    components?: Record<string, unknown>;
  }) => chronicleSectionMdxRendererMock(props),
}));
jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="release-section">{children}</div>
  ),
}));

import { ChronicleMdxRenderer } from "@/components/chronicles/ChronicleMdxRenderer";

describe("ChronicleMdxRenderer", () => {
  beforeEach(() => {
    chronicleSectionMdxRendererMock.mockClear();
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
      | { components?: Record<string, unknown> }
      | undefined;

    expect(props).toMatchObject({
      code: "compiled-mdx",
      postDate: "2026-04-10",
    });
    expect(props?.components?.ReleaseSection).toBeDefined();
  });
});
