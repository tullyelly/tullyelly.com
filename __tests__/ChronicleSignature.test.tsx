import { render, screen } from "@testing-library/react";

import { ChronicleSignature } from "@/components/chronicles/ChronicleSignature";
import type { TagMetadata } from "@/lib/tags-server";

describe("ChronicleSignature", () => {
  it("routes footer tags through resolved metadata before smart fallbacks", () => {
    const tagMetadataBySlug = new Map<string, TagMetadata>([
      [
        "freak",
        {
          slug: "freak",
          displayName: "Giannis Antetokounmpo",
          href: "/cardattack/homies/freak",
          hrefKind: "homie",
          isClickable: true,
          meta: {},
        },
      ],
    ]);

    render(
      <ChronicleSignature
        title="aau nationals"
        date="2026-07-07"
        summary="Take 2"
        tags={["freak", "lulu", "gang starr"]}
        tagMetadataBySlug={tagMetadataBySlug}
      />,
    );

    expect(screen.getByRole("link", { name: "#freak" })).toHaveAttribute(
      "href",
      "/cardattack/homies/freak",
    );
    expect(screen.getByRole("link", { name: "#lulu" })).toHaveAttribute(
      "href",
      "/unclejimmy/squad/lulu",
    );
    expect(screen.getByRole("link", { name: "#gang-starr" })).toHaveAttribute(
      "href",
      "/shaolin/tags/gang-starr",
    );
  });
});
