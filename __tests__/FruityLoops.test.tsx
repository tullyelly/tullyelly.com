import { render, screen } from "@testing-library/react";

import FruityLoops from "@/components/FruityLoops";

describe("FruityLoops", () => {
  it("matches markdown image desktop width behavior while keeping full-width rendering", () => {
    const { container } = render(<FruityLoops loop="examples/example.webp" />);

    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper).toHaveClass("mx-auto", "w-full", "md:max-w-[520px]");

    const image = screen.getByAltText("looped animation");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveClass("w-full");
    expect(image).not.toHaveClass("max-w-3xl");
  });

  it("resolves reusable Fruity Loops assets", () => {
    render(<FruityLoops loop="wu-tang" />);

    expect(screen.getByAltText("looped animation")).toHaveAttribute(
      "src",
      "/images/optimus/fruity-loops/wu-tang.webp",
    );
  });

  it("resolves another shared Fruity Loops asset", () => {
    render(<FruityLoops loop="67-kid" />);

    expect(screen.getByAltText("looped animation")).toHaveAttribute(
      "src",
      "/images/optimus/fruity-loops/67-kid.webp",
    );
  });

  it("resolves one-off relative Optimus assets without changing the extension", () => {
    render(<FruityLoops loop="aau-nationals/wu-tang.webp" alt="wu-tang" />);

    expect(screen.getByAltText("wu-tang")).toHaveAttribute(
      "src",
      "/images/optimus/aau-nationals/wu-tang.webp",
    );
  });

  it("resolves one-off Optimus assets", () => {
    render(<FruityLoops loop="tcdb/serve.webp" />);

    expect(screen.getByAltText("looped animation")).toHaveAttribute(
      "src",
      "/images/optimus/tcdb/serve.webp",
    );
  });

  it("preserves the supplied extension for slash-containing sources", () => {
    render(<FruityLoops loop="examples/animation.gif" />);

    expect(screen.getByAltText("looped animation")).toHaveAttribute(
      "src",
      "/images/optimus/examples/animation.gif",
    );
  });
});
