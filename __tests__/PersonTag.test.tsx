import { render, screen } from "@testing-library/react";
import PersonTag from "@/components/mdx/PersonTag";

describe("PersonTag", () => {
  it("uses the tag when displayName is omitted", () => {
    render(<PersonTag tag="derek" />);

    const tag = screen.getByText("derek");
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveAttribute("data-person-tag", "derek");
  });

  it("uses displayName when provided", () => {
    render(<PersonTag tag="jeff-meff" displayName="jeff meff" />);

    const tag = screen.getByText("jeff meff");
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveAttribute("data-person-tag", "jeff-meff");
  });
});
