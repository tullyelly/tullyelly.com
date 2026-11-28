import Directory from "@/app/cardattack/tcdb-trade/page";
import Detail from "@/app/cardattack/tcdb-trade/[tradeId]/page";

test("singular trade directory preserves public controls only", async () => {
  await expect(
    Directory({
      searchParams: Promise.resolve({
        q: "collector",
        status: "Completed",
        token: "private",
      }),
    }),
  ).rejects.toMatchObject({
    digest: expect.stringContaining(
      "/cardattack/tcdb-trades?q=collector&status=Completed;",
    ),
  });
});
test("singular trade detail retains safe Hall of Fame returns", async () => {
  await expect(
    Detail({
      params: Promise.resolve({ tradeId: "123" }),
      searchParams: Promise.resolve({
        returnTo: "/cardattack/hof?view=inductions&q=set",
      }),
    }),
  ).rejects.toMatchObject({
    digest: expect.stringContaining(
      "/cardattack/tcdb-trades/123?returnTo=%2Fcardattack%2Fhof%3Fq%3Dset%26view%3Dinductions;",
    ),
  });
  await expect(
    Detail({
      params: Promise.resolve({ tradeId: "123" }),
      searchParams: Promise.resolve({ returnTo: "https://example.com" }),
    }),
  ).rejects.toMatchObject({
    digest: expect.stringContaining("returnTo=%2Fcardattack%2Ftcdb-trades;"),
  });
});
