import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";

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
const setCollectorMock = jest.fn(
  ({ set, snapshotDate }: { set: string; snapshotDate?: string }) => (
    <div data-testid="set-collector">{`${set}@${snapshotDate ?? "latest"}`}</div>
  ),
);

function CustomThing() {
  return <div data-testid="custom-thing" />;
}

jest.mock("@/components/mdx-renderer", () => ({
  MdxRenderer: (props: {
    code: string;
    components?: Record<string, unknown>;
  }) => mdxRendererMock(props),
}));
jest.mock("@/components/mdx/TcdbSnapshot", () => ({
  __esModule: true,
  default: (props: { tag: string; snapshotDate: string }) =>
    tcdbSnapshotMock(props),
}));
jest.mock("@/components/mdx/SetCollector", () => ({
  __esModule: true,
  default: (props: { set: string; snapshotDate?: string }) =>
    setCollectorMock(props),
}));

import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";

describe("ChronicleSectionMdxRenderer", () => {
  beforeEach(() => {
    mdxRendererMock.mockClear();
    setCollectorMock.mockClear();
    tcdbSnapshotMock.mockClear();
  });

  it("binds the current post date into date-aware MDX helpers and preserves passed components", () => {
    render(
      <ChronicleSectionMdxRenderer
        code="compiled-mdx"
        postDate="2026-04-10"
        components={{ CustomThing }}
      />,
    );

    const props = mdxRendererMock.mock.calls[0]?.[0] as
      | { components?: Record<string, unknown> }
      | undefined;
    const BoundSetCollector = props?.components?.SetCollector as
      | ComponentType<{ set: string }>
      | undefined;
    const BoundTcdbSnapshot = props?.components?.TcdbSnapshot as
      | ComponentType<{ tag: string }>
      | undefined;

    expect(props?.components?.CustomThing).toBe(CustomThing);
    expect(BoundSetCollector).toBeDefined();
    expect(BoundTcdbSnapshot).toBeDefined();

    if (!BoundSetCollector) {
      throw new Error(
        "Expected SetCollector to be bound in ChronicleSectionMdxRenderer",
      );
    }

    if (!BoundTcdbSnapshot) {
      throw new Error(
        "Expected TcdbSnapshot to be bound in ChronicleSectionMdxRenderer",
      );
    }

    render(<BoundSetCollector set="1992-courtside-draft-pix" />);
    render(<BoundTcdbSnapshot tag="shaq" />);

    expect(screen.getByTestId("set-collector")).toHaveTextContent(
      "1992-courtside-draft-pix@2026-04-10",
    );
    expect(screen.getByTestId("tcdb-snapshot")).toHaveTextContent(
      "shaq@2026-04-10",
    );
    expect(setCollectorMock.mock.calls[0]?.[0]).toEqual({
      set: "1992-courtside-draft-pix",
      snapshotDate: "2026-04-10",
    });
    expect(tcdbSnapshotMock.mock.calls[0]?.[0]).toEqual({
      tag: "shaq",
      snapshotDate: "2026-04-10",
    });
  });
});
