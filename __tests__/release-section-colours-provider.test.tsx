import * as React from "react";
import { render, screen } from "@testing-library/react";

import {
  ReleaseSectionColoursProvider,
  useNextRainbowColour,
} from "@/components/providers/ReleaseSectionColoursProvider";
import { RAINBOW_COLOURS } from "@/lib/release-section-colours";

function ColourProbe({ testId }: { testId: string }) {
  const colour = useNextRainbowColour();
  return <span data-testid={testId}>{colour ?? "none"}</span>;
}

describe("ReleaseSectionColoursProvider", () => {
  it("returns undefined safely when used outside provider", () => {
    render(<ColourProbe testId="probe" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
  });

  it("consumes colours sequentially within one render tree", () => {
    render(
      <ReleaseSectionColoursProvider totalSections={7}>
        <ColourProbe testId="one" />
        <ColourProbe testId="two" />
        <ColourProbe testId="three" />
      </ReleaseSectionColoursProvider>,
    );

    expect(screen.getByTestId("one")).toHaveTextContent(RAINBOW_COLOURS[0]);
    expect(screen.getByTestId("two")).toHaveTextContent(RAINBOW_COLOURS[1]);
    expect(screen.getByTestId("three")).toHaveTextContent(RAINBOW_COLOURS[2]);
  });

  it("wraps safely when calls exceed the precomputed list length", () => {
    render(
      <ReleaseSectionColoursProvider totalSections={7}>
        {Array.from({ length: 9 }, (_, index) => (
          <ColourProbe key={index} testId={`probe-${index}`} />
        ))}
      </ReleaseSectionColoursProvider>,
    );

    expect(screen.getByTestId("probe-7")).toHaveTextContent(RAINBOW_COLOURS[0]);
    expect(screen.getByTestId("probe-8")).toHaveTextContent(RAINBOW_COLOURS[1]);
  });

  it("recomputes deterministically on rerender of the same tree", () => {
    const { rerender } = render(
      <ReleaseSectionColoursProvider totalSections={7}>
        <ColourProbe testId="first" />
        <ColourProbe testId="second" />
      </ReleaseSectionColoursProvider>,
    );

    expect(screen.getByTestId("first")).toHaveTextContent(RAINBOW_COLOURS[0]);
    expect(screen.getByTestId("second")).toHaveTextContent(RAINBOW_COLOURS[1]);

    rerender(
      <ReleaseSectionColoursProvider totalSections={7}>
        <ColourProbe testId="first" />
        <ColourProbe testId="second" />
      </ReleaseSectionColoursProvider>,
    );

    expect(screen.getByTestId("first")).toHaveTextContent(RAINBOW_COLOURS[0]);
    expect(screen.getByTestId("second")).toHaveTextContent(RAINBOW_COLOURS[1]);
  });
});
