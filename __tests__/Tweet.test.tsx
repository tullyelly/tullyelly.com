import { render, screen } from "@testing-library/react";

import { XEmbed } from "@/components/Tweet";

describe("XEmbed", () => {
  it("renders legacy posts without parsing tweet entities", () => {
    render(<XEmbed id="1505079314303397894" />);

    expect(screen.getByTitle("Post on X 1505079314303397894")).toHaveAttribute(
      "src",
      "https://platform.twitter.com/embed/Tweet.html?id=1505079314303397894&theme=light",
    );
    expect(screen.getByRole("link", { name: "Open this post on X" })).toHaveAttribute(
      "href",
      "https://x.com/i/status/1505079314303397894",
    );
  });

  it("does not render an unsafe or malformed post id", () => {
    const { container } = render(<XEmbed id={'1" onload="bad'} />);
    expect(container).toBeEmptyDOMElement();
  });
});
