const DEFAULT_RETRIES = 4;
const DEFAULT_FACTOR = 1.8;
const DEFAULT_MIN_TIMEOUT = 250;
const DEFAULT_MAX_TIMEOUT = 2000;

type RetryOptions = {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    factor = DEFAULT_FACTOR,
    minTimeout = DEFAULT_MIN_TIMEOUT,
    maxTimeout = DEFAULT_MAX_TIMEOUT,
  } = options;

  let attempt = 0;
  let delay = minTimeout;

  for (;;) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        throw error;
      }
      if (process.env.CI === "1" || process.env.CI === "true") {
        console.warn(`[db-retry] attempt ${attempt} failed`, error);
      }
      const timeout = Math.min(maxTimeout, delay);
      await wait(timeout);
      delay *= factor;
    }
  }
}
