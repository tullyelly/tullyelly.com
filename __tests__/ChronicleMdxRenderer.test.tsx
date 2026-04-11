import { render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

const mdxRendererMock = jest.fn(
  ({ code }: { code: string; components?: Record<string, unknown> }) => (
    <div data-testid="mdx-renderer">{code}</div>
  ),
);
const tcdbSnapshotMock = jest.fn(
  ({ tag, snapshotDate }: { tag: string; snapshotDate: string }) => (
    <div data-testid="tcdb-snapshot">{`${tag}@${snapshotDate}`}</div>
  ),
);

jest.mock("@/components/mdx-renderer", () => ({
  MdxRenderer: (props: { code: string; components?: Record<string, unknown> }) =>
    mdxRendererMock(props),
}));
jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="release-section">{children}</div>
  ),
}));
jest.mock("@/components/mdx/TcdbSnapshot", () => ({
  __esModule: true,
  default: (props: { tag: string; snapshotDate: string }) =>
    tcdbSnapshotMock(props),
}));

import { ChronicleMdxRenderer } from "@/components/chronicles/ChronicleMdxRenderer";

describe("ChronicleMdxRenderer", () => {
  beforeEach(() => {
    mdxRendererMock.mockClear();
    tcdbSnapshotMock.mockClear();
  });

  it("binds the current chronicle date into the TcdbSnapshot MDX component", () => {
    render(
      <ChronicleMdxRenderer
        code="compiled-mdx"
        postDate="2026-04-10"
        source={'<TcdbSnapshot tag="shaq" />'}
      />,
    );

    const props = mdxRendererMock.mock.calls[0]?.[0] as
      | { components?: Record<string, unknown> }
      | undefined;
    const BoundTcdbSnapshot = props?.components?.TcdbSnapshot as
      | ComponentType<{ tag: string }>
      | undefined;

    expect(BoundTcdbSnapshot).toBeDefined();

    if (!BoundTcdbSnapshot) {
      throw new Error("Expected TcdbSnapshot to be bound in ChronicleMdxRenderer");
    }

    render(<BoundTcdbSnapshot tag="shaq" />);

    expect(screen.getByTestId("tcdb-snapshot")).toHaveTextContent(
      "shaq@2026-04-10",
    );
    expect(tcdbSnapshotMock.mock.calls[0]?.[0]).toEqual({
      tag: "shaq",
      snapshotDate: "2026-04-10",
    });
  });
});
