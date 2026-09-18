import { render, screen } from "@testing-library/react";
import type { Post } from "contentlayer/generated";

import { RelatedChronicles } from "@/components/chronicles/RelatedChronicles";

function post(slug: string, overrides: Record<string, unknown> = {}): Post {
  return {
    slug,
    title: slug,
    summary: `${slug} summary`,
    date: "2026-01-01",
    url: `/shaolin/${slug}`,
    tags: [],
    resolvedAlterEgo: "tullyelly",
    draft: false,
    ...overrides,
  } as unknown as Post;
}

describe("RelatedChronicles", () => {
  it("shows contextual Chronicle links and omits unrelated posts", () => {
    const current = post("current", {
      title: "Current Chronicle",
      tags: ["cards"],
      resolvedAlterEgo: "cardattack",
    });

    render(
      <RelatedChronicles
        currentPost={current}
        posts={[
          current,
          post("related", {
            title: "Card Story",
            summary: "A memorable trade.",
            tags: ["cards"],
            resolvedAlterEgo: "cardattack",
          }),
          post("unrelated", { resolvedAlterEgo: "mark2" }),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Related Chronicles" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Card Story" })).toHaveAttribute(
      "href",
      "/shaolin/related",
    );
    expect(screen.getByText("A memorable trade.")).toBeVisible();
    expect(screen.getByText(/#cards/)).toBeVisible();
    expect(screen.queryByText("unrelated")).toBeNull();
  });

  it("renders no section when nothing meets the threshold", () => {
    const current = post("current", { resolvedAlterEgo: "cardattack" });
    const { container } = render(
      <RelatedChronicles
        currentPost={current}
        posts={[current, post("unrelated", { resolvedAlterEgo: "mark2" })]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
