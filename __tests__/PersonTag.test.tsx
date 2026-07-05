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

  it("routes known alter ego tags to persona landing pages", () => {
    render(<PersonTag tag="unclejimmy" />);

    expect(screen.getByRole("link", { name: "unclejimmy" })).toHaveAttribute(
      "href",
      "/unclejimmy",
    );
  });

  it("routes known squad member tags to squad pages", () => {
    render(<PersonTag tag="lulu" />);

    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "href",
      "/unclejimmy/squad/lulu",
    );
  });

  it("uses an explicit href override when provided", () => {
    render(<PersonTag tag="lulu" href="/custom-route" />);

    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "href",
      "/custom-route",
    );
  });

  it("preserves the visual tag treatment", () => {
    render(<PersonTag tag="derek" />);

    const tag = screen.getByRole("link", { name: "derek" });

    expect(tag).toHaveClass(
      "font-bold",
      "italic",
      "!text-[var(--blue)]",
      "!no-underline",
      "hover:!bg-[var(--blue)]",
      "hover:!text-white",
      "hover:!no-underline",
    );
    expect(tag).not.toHaveClass("underline-offset-2");
    expect(tag).not.toHaveClass("hover:underline");
  });
});
