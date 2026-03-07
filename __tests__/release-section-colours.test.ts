import {
  RAINBOW_COLOURS,
  buildRainbowColourList,
} from "@/lib/release-section-colours";

describe("release-section-colours", () => {
  it("exports rainbow colours in canonical order", () => {
    expect(RAINBOW_COLOURS).toEqual([
      "#FF0000",
      "#FF7F00",
      "#FFFF00",
      "#00FF00",
      "#0000FF",
      "#4B0082",
      "#8F00FF",
    ]);
  });

  it("returns an empty list when total is 0 or below", () => {
    expect(buildRainbowColourList(0)).toEqual([]);
    expect(buildRainbowColourList(-3)).toEqual([]);
  });

  it("returns sequential rainbow colours for total 7", () => {
    expect(buildRainbowColourList(7)).toEqual([...RAINBOW_COLOURS]);
  });

  it("wraps rainbow colours when total exceeds 7", () => {
    expect(buildRainbowColourList(8)).toEqual([
      "#FF0000",
      "#FF7F00",
      "#FFFF00",
      "#00FF00",
      "#0000FF",
      "#4B0082",
      "#8F00FF",
      "#FF0000",
    ]);
  });

  it("selects a random unique subset for total <= 6 and returns canonical order", () => {
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.99) // violet
      .mockReturnValueOnce(0.0) // red
      .mockReturnValueOnce(0.4); // green

    try {
      expect(buildRainbowColourList(3)).toEqual([
        "#FF0000",
        "#00FF00",
        "#8F00FF",
      ]);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("never repeats colours when total <= 6", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    try {
      const colours = buildRainbowColourList(6);
      expect(colours).toHaveLength(6);
      expect(new Set(colours).size).toBe(6);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
