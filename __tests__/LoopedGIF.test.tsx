import { render, screen } from "@testing-library/react";

import LoopedGif from "@/components/LoopedGIF";

describe("LoopedGif", () => {
  it("matches markdown image desktop width behavior while keeping full-width rendering", () => {
    const { container } = render(<LoopedGif src="/images/example.webp" />);

    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper).toHaveClass("mx-auto", "w-full", "md:max-w-[520px]");

    const image = screen.getByAltText("looped animation");
    expect(image).toHaveClass("w-full");
    expect(image).not.toHaveClass("max-w-3xl");
  });
});
