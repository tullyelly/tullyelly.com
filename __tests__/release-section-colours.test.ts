import {
  RAINBOW_COLOURS,
  buildRainbowColourList,
} from "@/lib/release-section-colours";

const rainbowIndexByColour = new Map<string, number>(
  RAINBOW_COLOURS.map((colour, index) => [colour, index]),
);
const rainbowColourSet = new Set<string>(RAINBOW_COLOURS);

const isCanonicalRainbowOrder = (colours: string[]): boolean => {
  let previous = -1;

  for (const colour of colours) {
    const current = rainbowIndexByColour.get(colour);
    if (current === undefined) return false;
    if (current <= previous) return false;
    previous = current;
  }

  return true;
};

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

  it("for total 1..6 returns a unique subset sorted in canonical rainbow order", () => {
    for (let total = 1; total <= 6; total += 1) {
      const colours = buildRainbowColourList(total);

      expect(colours).toHaveLength(total);
      expect(new Set(colours).size).toBe(total);
      expect(colours.every((colour) => rainbowColourSet.has(colour))).toBe(true);
      expect(isCanonicalRainbowOrder(colours)).toBe(true);
    }
  });

  it("returns sequential rainbow colours for total 7", () => {
    expect(buildRainbowColourList(7)).toEqual([...RAINBOW_COLOURS]);
  });

  it("wraps rainbow colours in canonical order for total 8+", () => {
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
    expect(buildRainbowColourList(15)).toEqual([
      "#FF0000",
      "#FF7F00",
      "#FFFF00",
      "#00FF00",
      "#0000FF",
      "#4B0082",
      "#8F00FF",
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
    const colours = buildRainbowColourList(6);
    expect(colours).toHaveLength(6);
    expect(new Set(colours).size).toBe(6);
  });
});
