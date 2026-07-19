import { render, screen } from "@testing-library/react";

import PersonTag from "@/components/mdx/PersonTag";
import { CipherSays } from "@/components/scrolls/CipherSays";
import { ScrollAmendment } from "@/components/scrolls/ScrollAmendment";

describe("ScrollAmendment", () => {
  it("renders the release-style tab with cream/ink label and blue/white body", () => {
    render(
      <ScrollAmendment date="2026-07-19">
        Only chronicles 1-10 were updated.
      </ScrollAmendment>,
    );

    const wrapper = screen.getByRole("note");
    expect(wrapper).toHaveClass("relative");
    expect(wrapper).toHaveClass("block");
    expect(wrapper).toHaveClass("w-full");
    expect(wrapper.className).toContain("bg-[var(--blue)]");
    expect(wrapper.className).toContain("text-[color:var(--text-on-blue)]");
    expect(wrapper.className).toContain("[&_a]:!text-white");
    expect(wrapper.className).toContain("[&_a:hover]:bg-white");
    expect(wrapper.className).toContain(
      "[&_a:hover]:!text-[color:var(--blue)]",
    );
    expect(wrapper).toHaveAttribute("data-scroll-amendment");
    expect(wrapper.className).not.toContain("border-[var(--blue-contrast)]");
    expect(wrapper.className).toContain(
      "[&_ul>li]:marker:text-[color:var(--text-on-blue)]",
    );

    const label = screen.getByText("scroll amendment · 2026-07-19");
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
      <ScrollAmendment date="2026-07-19">
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

describe("CipherSays", () => {
  it("renders the Cipher tab with a chrome-on-ink body treatment", () => {
    render(<CipherSays>Try the boring fix first.</CipherSays>);

    const wrapper = screen.getByRole("note");
    expect(wrapper).toHaveClass("relative");
    expect(wrapper).toHaveClass("block");
    expect(wrapper).toHaveClass("w-full");
    expect(wrapper.className).toContain("bg-[var(--ink)]");
    expect(wrapper.className).toContain("text-[color:var(--tc-chrome-hi)]");
    expect(wrapper.className).toContain(
      "[&_a]:!text-[color:var(--tc-chrome-hi)]",
    );
    expect(wrapper.className).toContain(
      "[&_a:hover]:bg-[var(--tc-chrome-silver)]",
    );
    expect(wrapper.className).toContain("[&_a:hover]:!text-[color:var(--ink)]");
    expect(wrapper).toHaveAttribute("data-cipher-says");
    expect(wrapper).not.toHaveAttribute("data-scroll-amendment");
    expect(wrapper.className).toContain(
      "[&_ul>li]:marker:text-[color:var(--tc-chrome-hi)]",
    );

    const label = screen.getByText("cipher says");
    expect(label).toHaveClass("absolute");
    expect(label).toHaveClass("rounded-tl-lg");
    expect(label).toHaveClass("rounded-tr-none");
    expect(label).toHaveStyle({
      backgroundColor: "var(--tc-chrome-silver)",
    });

    expect(screen.getByText("Try the boring fix first.")).toBeInTheDocument();
  });

  it("keeps Cipher person tags on the chrome text treatment", () => {
    render(
      <CipherSays>
        <PersonTag tag="cipher" /> caught the mismatch.
      </CipherSays>,
    );

    const wrapper = screen.getByRole("note");
    expect(wrapper.className).toContain(
      "[&_[data-person-tag]]:!text-[color:var(--tc-chrome-hi)]",
    );

    expect(screen.getByText("cipher")).toHaveAttribute(
      "data-person-tag",
      "cipher",
    );
  });
});
