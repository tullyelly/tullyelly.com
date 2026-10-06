import { render, screen } from "@testing-library/react";
import PersonTag from "@/components/mdx/PersonTag";

describe("PersonTag", () => {
  it("uses the tag when displayName is omitted", () => {
    render(<PersonTag tag="derek" />);

    const tag = screen.getByRole("link", { name: "derek" });
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveAttribute("data-person-tag", "derek");
    expect(tag).toHaveAttribute("href", "/shaolin/tags/derek");
  });

  it("uses displayName when provided", () => {
    render(<PersonTag tag="jeff-meff" displayName="jeff meff" />);

    const tag = screen.getByRole("link", { name: "jeff meff" });
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveAttribute("data-person-tag", "jeff-meff");
  });

  it("routes default tags to the Shaolin tag archive", () => {
    render(<PersonTag tag="Gang Starr" />);

    expect(screen.getByRole("link", { name: "Gang Starr" })).toHaveAttribute(
      "href",
      "/shaolin/tags/gang-starr",
    );
  });

  it("uses the archive fallback for persona tags without metadata", () => {
    render(<PersonTag tag="unclejimmy" />);

    expect(screen.getByRole("link", { name: "unclejimmy" })).toHaveAttribute(
      "href",
      "/shaolin/tags/unclejimmy",
    );
  });

  it("uses the archive fallback for squad tags without metadata", () => {
    render(<PersonTag tag="lulu" />);

    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "href",
      "/shaolin/tags/lulu",
    );
  });

  it("ignores authored hrefs without stored metadata", () => {
    render(<PersonTag tag="lulu" href="/custom-route" />);

    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "href",
      "/shaolin/tags/lulu",
    );
  });

  it("preserves the visual tag treatment", () => {
    render(<PersonTag tag="derek" />);

    const tag = screen.getByRole("link", { name: "derek" });

    expect(tag).toHaveClass(
      "font-bold",
      "italic",
      "!text-[var(--person-tag-color,var(--blue))]",
      "!no-underline",
      "hover:!bg-[var(--person-tag-hover-bg,var(--blue))]",
      "hover:!text-[var(--person-tag-hover-color,var(--white))]",
      "hover:!no-underline",
    );
    expect(tag).not.toHaveClass("underline-offset-2");
    expect(tag).not.toHaveClass("hover:underline");
  });
});
