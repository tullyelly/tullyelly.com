import { render, screen } from "@testing-library/react";
import TagLink, { TagMetadataProvider } from "@/components/tags/TagLink";
import PersonTag from "@/components/mdx/PersonTag";
import YouTubeVideo from "@/components/mdx/YouTubeVideo";
import { ChronicleSignature } from "@/components/chronicles/ChronicleSignature";
import ChronicleListClient from "@/app/shaolin/_components/ChronicleListClient";
import TagDirectoryClient from "@/app/shaolin/tags/_components/TagDirectoryClient";
import { resolveTagHref } from "@/lib/tags";

const stored = { href: "/stored-route", hrefKind: "custom", isClickable: true };
const disabled = { href: "/stored-route", hrefKind: "none", isClickable: true };

it("uses the normalized matching snapshot before authored routes and preserves labels", () => {
  render(
    <TagMetadataProvider metadata={{ "gang-starr": stored }}>
      <PersonTag tag=" Gang  Starr " displayName="Artist" href="/authored" />
      <YouTubeVideo
        id="example"
        tag="Gang Starr"
        displayName="Video artist"
        href="/authored-video"
      />
      <TagLink tag="Gang Starr">Inline reference</TagLink>
    </TagMetadataProvider>,
  );
  for (const label of ["Artist", "Video artist", "Inline reference"]) {
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      "/stored-route",
    );
  }
});

it.each([{ ...stored, isClickable: false }, disabled])(
  "keeps disabled metadata non-clickable in inline, video, and signature consumers",
  (metadata) => {
    render(
      <TagMetadataProvider metadata={{ lulu: metadata }}>
        <PersonTag tag="lulu" href="/authored" />
        <YouTubeVideo
          id="example"
          tag="lulu"
          displayName="Video label"
          href="/authored"
        />
        <ChronicleSignature title="test" date="2026-10-05" tags={["lulu"]} />
      </TagMetadataProvider>,
    );
    expect(screen.getByText("lulu").tagName).toBe("SPAN");
    expect(screen.getByText("Video label").tagName).toBe("SPAN");
    expect(screen.getByText("#lulu").tagName).toBe("SPAN");
    expect(screen.queryByRole("link", { name: /lulu|Video label/ })).toBeNull();
  },
);

it("renders canonical and disabled tag pills in both Chronicle list layouts", () => {
  render(
    <TagMetadataProvider metadata={{ lulu: stored, disabled }}>
      <ChronicleListClient
        rows={[
          {
            slug: "test",
            url: "/shaolin/test",
            title: "Test Chronicle",
            summary: "test",
            date: "2026-10-05",
            alterEgo: "mark2",
            tags: ["lulu", "disabled", " A/B & C "],
            infinityStone: false,
          },
        ]}
        alterEgos={["mark2"]}
      />
    </TagMetadataProvider>,
  );
  expect(screen.getAllByRole("link", { name: "#lulu" })).toHaveLength(2);
  for (const link of screen.getAllByRole("link", { name: "#lulu" }))
    expect(link).toHaveAttribute("href", "/stored-route");
  expect(screen.queryByRole("link", { name: "#disabled" })).toBeNull();
  expect(screen.getAllByText("#disabled")).toHaveLength(2);
  for (const link of screen.getAllByRole("link", { name: "#a/b-&-c" }))
    expect(link).toHaveAttribute("href", "/shaolin/tags/a%2Fb-%26-c");
});

it("keeps explicitly labeled archive access for disabled and routed directory tags in both layouts", () => {
  render(
    <TagDirectoryClient
      rows={[stored, disabled].map((metadata, index) => ({
        slug: index ? "disabled" : "lulu",
        metadata,
        canonicalDisplayName: "Label",
        chronicleCount: index + 1,
        alias: null,
        personTagNames: [],
        remainingPersonTagNameCount: 0,
      }))}
    />,
  );
  for (const link of screen.getAllByRole("link", { name: "#lulu" }))
    expect(link).toHaveAttribute("href", "/stored-route");
  expect(screen.getAllByRole("link", { name: "#lulu" })).toHaveLength(2);
  expect(screen.queryByRole("link", { name: "#disabled" })).toBeNull();
  for (const link of screen.getAllByRole("link", {
    name: "Chronicle archive (2)",
  }))
    expect(link).toHaveAttribute("href", "/shaolin/tags/disabled");
  expect(
    screen.getAllByRole("link", { name: "Chronicle archive (2)" }),
  ).toHaveLength(2);
});

it.each([undefined, { ...stored, href: null }, { ...stored, href: " \t " }])(
  "normalizes and encodes the single archive fallback",
  (metadata) => {
    expect(resolveTagHref(" A/B & C ", metadata)).toBe(
      "/shaolin/tags/a%2Fb-%26-c",
    );
  },
);

it("uses a fresh server resolution when a client navigation retains an older layout snapshot", () => {
  render(
    <TagMetadataProvider metadata={{ lulu: stored }}>
      <PersonTag
        tag="lulu"
        href="/authored"
        metadata={{
          href: "/updated-stored-route",
          hrefKind: "persona",
          isClickable: true,
        }}
      />
    </TagMetadataProvider>,
  );
  expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
    "href",
    "/updated-stored-route",
  );
});
