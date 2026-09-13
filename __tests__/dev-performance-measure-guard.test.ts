import { installNegativePerformanceMeasureGuard } from "@/lib/dev-performance-measure-guard";

describe("installNegativePerformanceMeasureGuard", () => {
  it("skips invalid negative end timestamps", () => {
    const measure = jest.fn();
    const target = { measure } as unknown as Performance;

    installNegativePerformanceMeasureGuard(target);
    target.measure("\u200bPage", { start: 0, end: Number.NEGATIVE_INFINITY });

    expect(measure).not.toHaveBeenCalled();
  });

  it("preserves valid measurements and installs only once", () => {
    const result = {} as PerformanceMeasure;
    const measure = jest.fn(() => result);
    const target = { measure } as unknown as Performance;

    installNegativePerformanceMeasureGuard(target);
    const guardedMeasure = target.measure;
    installNegativePerformanceMeasureGuard(target);

    expect(target.measure).toBe(guardedMeasure);
    expect(target.measure("Page", { start: 1, end: 2 })).toBe(result);
    expect(measure).toHaveBeenCalledWith(
      "Page",
      { start: 1, end: 2 },
      undefined,
    );
  });
});
