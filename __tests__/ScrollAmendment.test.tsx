import { render, screen } from "@testing-library/react";

import PersonTag from "@/components/mdx/PersonTag";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";

describe("ScrollAmendment", () => {
  it("renders the release-style tab with cream/ink label and blue/white body", () => {
    render(
      <ScrollAmendment>Only chronicles 1-10 were updated.</ScrollAmendment>,
    );

    const wrapper = screen.getByRole("note");
    expect(wrapper).toHaveClass("relative");
    expect(wrapper).toHaveClass("block");
    expect(wrapper).toHaveClass("w-full");
    expect(wrapper.className).toContain("bg-[var(--blue)]");
    expect(wrapper.className).toContain("text-[color:var(--text-on-blue)]");
    expect(wrapper.className).toContain("[&_a]:!text-white");
    expect(wrapper.className).toContain("[&_a:hover]:bg-white");
    expect(wrapper.className).toContain("[&_a:hover]:!text-[color:var(--blue)]");
    expect(wrapper.className).not.toContain("border-[var(--blue-contrast)]");
    expect(wrapper.className).toContain(
      "[&_ul>li]:marker:text-[color:var(--text-on-blue)]",
    );

    const label = screen.getByText("scroll amendment");
    expect(label).toHaveClass("absolute");
    expect(label).toHaveClass("rounded-tl-lg");
    expect(label).toHaveClass("rounded-tr-none");
    expect(label).toHaveStyle({
      backgroundColor: "var(--cream)",
    });

    expect(
      screen.getByText("Only chronicles 1-10 were updated."),
    ).toBeInTheDocument();
  });

  it("keeps inline person tags on the white text treatment", () => {
    render(
      <ScrollAmendment>
        <PersonTag tag="nikkigirl" /> sent in the correction.
      </ScrollAmendment>,
    );

    const wrapper = screen.getByRole("note");
    expect(wrapper.className).toContain(
      "[&_[data-person-tag]]:!text-[color:var(--text-on-blue)]",
    );

    expect(screen.getByText("nikkigirl")).toHaveAttribute(
      "data-person-tag",
      "nikkigirl",
    );
  });
});
