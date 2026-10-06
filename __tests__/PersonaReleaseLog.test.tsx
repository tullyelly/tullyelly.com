import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { AlterEgoReleaseEntry } from "@/lib/alter-ego-release-content";
const rendererMock = jest.fn(
  ({ code }: { code: string; components?: Record<string, unknown> }) => (
    <div>{code}</div>
  ),
);
jest.mock("@/lib/mdx/compile", () => ({
  compileMdxToCode: async () => "compiled",
}));
jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/chronicles/ChronicleSectionMdxRenderer", () => ({
  ChronicleSectionMdxRenderer: (props: {
    code: string;
    components?: Record<string, unknown>;
  }) => rendererMock(props),
}));
import { PersonaReleaseLogEntry } from "@/components/chronicles/PersonaReleaseLog";

it("does not let persona context or authored hrefs override canonical routing in release entries", async () => {
  const entry: AlterEgoReleaseEntry = {
    alterEgo: "theabbott",
    mdx: "source",
    bodyMdx: "body",
    offset: 0,
    sectionOrdinal: 1,
    totalSections: 1,
    sourceColourKey: "key",
    postSlug: "test",
    postUrl: "/shaolin/test",
    postTitle: "Test",
    postDate: "2026-10-05",
    postTags: ["artist"],
  };
  const tagMetadataBySlug = new Map([
    [
      "artist",
      {
        slug: "artist",
        displayName: "Artist",
        href: "/stored",
        hrefKind: "tag" as const,
        isClickable: true,
        meta: {
          identity: { contexts: { theabbott: { href: "/context-override" } } },
        },
      },
    ],
    [
      "disabled",
      {
        slug: "disabled",
        displayName: "Disabled",
        href: null,
        hrefKind: "none" as const,
        isClickable: false,
        meta: {},
      },
    ],
  ]);
  render(await PersonaReleaseLogEntry({ entry, tagMetadataBySlug }));
  const components = rendererMock.mock.calls[0][0].components!;
  const PersonTag = components.PersonTag as ComponentType<{
    tag: string;
    href?: string;
  }>;
  const Video = components.YouTubeVideo as ComponentType<{
    id: string;
    tag: string;
    href?: string;
  }>;
  render(
    <>
      <PersonTag tag="artist" href="/authored" />
      <PersonTag tag="disabled" href="/authored" />
      <Video id="example" tag="artist" href="/authored" />
    </>,
  );
  expect(screen.getByRole("link", { name: "artist" })).toHaveAttribute(
    "href",
    "/stored",
  );
  expect(screen.getByRole("link", { name: "Artist" })).toHaveAttribute(
    "href",
    "/stored",
  );
  expect(screen.queryByRole("link", { name: "disabled" })).toBeNull();
});
