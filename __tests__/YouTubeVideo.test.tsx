import { render, screen } from "@testing-library/react";
import YouTubeVideo from "@/components/mdx/YouTubeVideo";

describe("YouTubeVideo", () => {
  it("keeps the existing embed behavior intact", () => {
    const { container } = render(
      <YouTubeVideo
        id="gSJeHDlhYls"
        orientation="portrait"
        loop
        className="custom-video"
      />,
    );

    const iframe = screen.getByTitle("YouTube video player");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://www.youtube-nocookie.com/embed/gSJeHDlhYls?",
      ),
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("loop=1"));
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("playlist=gSJeHDlhYls"),
    );
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("modestbranding=1"),
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("rel=0"));
    expect(container.firstElementChild).toHaveClass(
      "mx-auto",
      "max-w-[360px]",
      "aspect-[9/16]",
      "custom-video",
    );
  });

  it("renders only artist metadata when only artist is provided", () => {
    const { container } = render(
      <YouTubeVideo id="gSJeHDlhYls" artist="DOOM" />,
    );

    const artist = screen.getByText("DOOM");
    expect(artist).toBeInTheDocument();
    expect(artist).toHaveAttribute("data-person-tag", "doom");
    expect(screen.queryByText("song:")).not.toBeInTheDocument();
    expect(screen.queryByText("album:")).not.toBeInTheDocument();
    expect(container.childElementCount).toBe(2);
  });

  it("renders artist, song, and album metadata when provided", () => {
    render(
      <YouTubeVideo
        id="gSJeHDlhYls"
        artist="DOOM"
        song="Doomsday"
        album="Operation: Doomsday"
      />,
    );

    const iframe = screen.getByTitle("YouTube video player");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://www.youtube-nocookie.com/embed/gSJeHDlhYls?",
      ),
    );

    const artist = screen.getByText("DOOM");
    expect(artist).toBeInTheDocument();
    expect(artist).toHaveAttribute("data-person-tag", "doom");
    expect(screen.getByText("song:")).toBeInTheDocument();
    expect(screen.getByText("Doomsday")).toBeInTheDocument();
    expect(screen.getByText("album:")).toBeInTheDocument();
    expect(screen.getByText("Operation: Doomsday")).toBeInTheDocument();
  });

  it("does not render a metadata wrapper when metadata props are omitted", () => {
    const { container } = render(<YouTubeVideo id="gSJeHDlhYls" />);

    expect(screen.getByTitle("YouTube video player")).toBeInTheDocument();
    expect(screen.queryByText("DOOM")).not.toBeInTheDocument();
    expect(screen.queryByText("song:")).not.toBeInTheDocument();
    expect(screen.queryByText("album:")).not.toBeInTheDocument();
    expect(container.childElementCount).toBe(1);
  });
});
