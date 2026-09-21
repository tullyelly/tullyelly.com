import { render, screen, within } from "@testing-library/react";
import CuteStampsPage from "@/app/unclejimmy/cute-stamps/page";
import HugBallPage from "@/app/unclejimmy/hug-ball/page";
import HeelsHaveEyesPage from "@/app/theabbott/heels-have-eyes/page";
import RoadworkRappinPage from "@/app/theabbott/roadwork-rappin/page";

describe("legacy media route integrations", () => {
  function expectOriginalPostDate(date: string, label: string) {
    expect(screen.getByText("Originally posted")).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveAttribute("datetime", date);
  }

  it("makes every Cute Stamps content image keyboard-accessible", () => {
    render(<CuteStampsPage />);

    expectOriginalPostDate("2025-09-19", "September 19, 2025");
    expect(screen.getAllByTestId("interactive-image-trigger")).toHaveLength(14);
    expect(
      screen.getByRole("button", {
        name: "Open image: Cute stamps collage in coral tones",
      }),
    ).toContainElement(
      screen.getByRole("img", {
        name: "Cute stamps collage in coral tones",
      }),
    );
  });

  it("makes both Hug Ball content images keyboard-accessible", () => {
    render(<HugBallPage />);

    expectOriginalPostDate("2025-11-13", "November 13, 2025");
    expect(screen.getAllByTestId("interactive-image-trigger")).toHaveLength(2);
    expect(
      screen.getByRole("button", {
        name: "Open image: A ball of tape. THE hug ball.",
      }),
    ).toBeInTheDocument();
  });

  it("uses the shared looping video and album grid for Heels Have Eyes", () => {
    render(<HeelsHaveEyesPage />);

    expectOriginalPostDate("2025-08-27", "August 27, 2025");
    const iframe = screen.getByTitle("YouTube video player");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/-mnJEnjyaY4"),
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("loop=1"));
    expect(screen.getByText("westside-gunn")).toHaveAttribute(
      "data-person-tag",
      "westside-gunn",
    );
    expect(screen.getByText("DAVEY BOY SMITH")).toBeInTheDocument();
    expect(screen.getAllByText("HEELS HAVE EYES")).toHaveLength(2);
    expect(
      within(
        screen
          .getByRole("heading", { name: "HEELS HAVE EYES", level: 4 })
          .closest("div")!,
      ).getByText("unclejimmy classic"),
    ).toBeInTheDocument();
  });

  it("uses the shared looping video and page-derived metadata for Roadwork Rappin’", () => {
    render(<RoadworkRappinPage />);

    expectOriginalPostDate("2025-08-19", "August 19, 2025");
    const iframe = screen.getByTitle("YouTube video player");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/jRHqjDnEFiE"),
    );
    expect(iframe).toHaveAttribute("src", expect.stringContaining("loop=1"));
    expect(screen.getByText("aesop")).toHaveAttribute(
      "data-person-tag",
      "aesop",
    );
    expect(screen.getAllByText("Black Hole Superette")).toHaveLength(2);
    expect(
      within(
        screen.getByText("Spirit World Field Guide").closest("div")!,
      ).getByText("unclejimmy classic"),
    ).toBeInTheDocument();
  });
});
