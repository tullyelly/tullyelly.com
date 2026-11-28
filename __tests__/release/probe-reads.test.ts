/** @jest-environment node */
import {
  boundedReads,
  verificationReads,
} from "../../scripts/release/probe-reads";

test("image fan-out is bounded and waits for active readers before surfacing failure", async () => {
  let active = 0,
    peak = 0;
  await expect(
    boundedReads(
      [0, 1, 2, 3, 4, 5],
      async (value) => {
        active++;
        peak = Math.max(peak, active);
        try {
          await new Promise((resolve) => setTimeout(resolve, 5));
          if (value === 2) throw new Error("asset-hash");
        } finally {
          active--;
        }
      },
      3,
    ),
  ).rejects.toThrow("asset-hash");
  expect(peak).toBe(3);
  expect(active).toBe(0);
});
test("duplicate content GETs share bytes only within one verification pass", async () => {
  const fetcher = jest.fn<typeof fetch>(
    async () => new Response("<html>publication</html>"),
  );
  const staged = verificationReads(fetcher),
    publicPass = verificationReads(fetcher);
  try {
    const [a, b] = await Promise.all([
      staged.fetcher("https://stage.vercel.app/shaolin"),
      staged.fetcher("https://stage.vercel.app/shaolin"),
    ]);
    expect(await a.text()).toBe(await b.text());
    expect(fetcher).toHaveBeenCalledTimes(1);
    await publicPass.fetcher("https://www.tullyelly.com/shaolin");
    expect(fetcher).toHaveBeenCalledTimes(2);
    await staged.fetcher("https://stage.vercel.app/mark2/admin/analytics");
    await staged.fetcher("https://stage.vercel.app/mark2/admin/analytics");
    expect(fetcher).toHaveBeenCalledTimes(4);
  } finally {
    staged.dispose();
    publicPass.dispose();
  }
});
test("response identity/redirects remain observable and the overall deadline aborts reads", async () => {
  const redirected = new Response("redirected");
  Object.defineProperty(redirected, "redirected", { value: true });
  const pass = verificationReads(async () => redirected);
  try {
    expect(
      (await pass.fetcher("https://stage.vercel.app/shaolin")).redirected,
    ).toBe(true);
  } finally {
    pass.dispose();
  }
  const slow = verificationReads(
    async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("deadline")),
          { once: true },
        );
      }),
    5,
  );
  try {
    await expect(
      slow.fetcher("https://stage.vercel.app/shaolin"),
    ).rejects.toThrow("deadline");
  } finally {
    slow.dispose();
  }
});
