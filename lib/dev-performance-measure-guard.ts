const INSTALL_KEY = Symbol.for("tullyelly.negative-performance-measure-guard");

type GuardedPerformance = Pick<Performance, "measure"> & {
  [INSTALL_KEY]?: boolean;
};

export function installNegativePerformanceMeasureGuard(
  target: GuardedPerformance,
): void {
  if (target[INSTALL_KEY]) return;

  const measure = target.measure.bind(target);

  target.measure = ((
    name: string,
    startOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ) => {
    if (
      typeof startOrOptions === "object" &&
      startOrOptions !== null &&
      typeof startOrOptions.end === "number" &&
      startOrOptions.end < 0
    ) {
      return undefined as unknown as PerformanceMeasure;
    }

    return measure(name, startOrOptions, endMark);
  }) as Performance["measure"];

  target[INSTALL_KEY] = true;
}
