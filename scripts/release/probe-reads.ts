/** Bounded read-only work and response reuse, owned by one verification pass. */
export async function boundedReads<T>(
  items: readonly T[],
  work: (item: T) => Promise<void>,
  limit = 4,
) {
  let cursor = 0;
  const failures: { index: number; error: unknown }[] = [];
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length && failures.length === 0) {
        const index = cursor++;
        const item = items[index];
        try {
          await work(item);
        } catch (error) {
          failures.push({ index, error });
        }
      }
    }),
  );
  if (failures.length)
    throw failures.sort((a, b) => a.index - b.index)[0].error;
}

export function verificationReads(
  fetcher: typeof fetch = fetch,
  deadlineMs = 120000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  const cache = new Map<
    string,
    Promise<{
      bytes: ArrayBuffer;
      status: number;
      headers: Headers;
      redirected: boolean;
      url: string;
    }>
  >();
  let retained = 0;
  const fetchRead: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    const signal =
      init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const options = {
      ...init,
      signal: signal
        ? AbortSignal.any([controller.signal, signal])
        : controller.signal,
    };
    // Authorization responses are deliberately never cached, even within a pass.
    const path = new URL(url).pathname;
    const reusable =
      method === "GET" &&
      (/^\/shaolin(?:\/|$)/.test(path) ||
        path.startsWith("/images/") ||
        path === "/_next/image");
    if (!reusable) return fetcher(input, options);
    const key = JSON.stringify([
      url,
      [
        ...new Headers(
          init?.headers ??
            (input instanceof Request ? input.headers : undefined),
        ),
      ],
    ]);
    let pending = cache.get(key);
    if (!pending) {
      pending = (async () => {
        const response = await fetcher(input, options);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 64 * 1024 * 1024)
          throw new Error("code.health-publication-asset");
        if (retained + bytes.byteLength > 16 * 1024 * 1024) cache.delete(key);
        else retained += bytes.byteLength;
        return {
          bytes,
          status: response.status,
          headers: response.headers,
          redirected: response.redirected,
          url: response.url,
        };
      })();
      cache.set(key, pending);
    }
    const saved = await pending;
    const response = new Response(
      [204, 205, 304].includes(saved.status) ? null : saved.bytes.slice(0),
      { status: saved.status, headers: saved.headers },
    );
    Object.defineProperties(response, {
      redirected: { value: saved.redirected },
      url: { value: saved.url },
    });
    return response;
  };
  return {
    fetcher: fetchRead,
    dispose: () => {
      clearTimeout(timer);
      cache.clear();
      controller.abort();
    },
  };
}
