export type AnyFn = (...args: unknown[]) => unknown;

export function callIfFn<T extends AnyFn>(
  candidate: unknown,
  ...args: Parameters<T>
): ReturnType<T> | undefined {
  if (typeof candidate === "function") {
    return (candidate as T)(...args);
  }
  return undefined;
}
