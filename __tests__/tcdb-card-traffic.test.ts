import {
  buildTcdbCardTrafficRows,
  buildTcdbCardTrafficWindow,
  getServerTodayDateString,
  normalizeTcdbCardTrafficDate,
} from "@/lib/tcdb-card-traffic";

describe("TCDb card traffic window", () => {
  it("puts a chronicle from today in slot 10", () => {
    const trafficWindow = buildTcdbCardTrafficWindow(
      "2026-06-29",
      "2026-06-29",
    );

    expect(trafficWindow.chronicleSlot).toBe(10);
    expect(trafficWindow.startDate).toBe("2026-06-20");
    expect(trafficWindow.endDate).toBe("2026-06-29");
    expect(trafficWindow.dates[9]).toMatchObject({
      date: "2026-06-29",
      slot: 10,
      isChronicleDate: true,
    });
  });

  it("puts yesterday in slot 9 with today as the only future date", () => {
    const trafficWindow = buildTcdbCardTrafficWindow(
      "2026-06-28",
      "2026-06-29",
    );

    expect(trafficWindow.chronicleSlot).toBe(9);
    expect(trafficWindow.dates[8]).toMatchObject({
      date: "2026-06-28",
      slot: 9,
      isChronicleDate: true,
    });
    expect(
      trafficWindow.dates.filter(
        (row) => row.date > trafficWindow.chronicleDate,
      ),
    ).toEqual([
      {
        date: "2026-06-29",
        slot: 10,
        isChronicleDate: false,
      },
    ]);
  });

  it("puts a chronicle from four days ago in slot 6", () => {
    const trafficWindow = buildTcdbCardTrafficWindow(
      "2026-06-25",
      "2026-06-29",
    );

    expect(trafficWindow.chronicleSlot).toBe(6);
    expect(trafficWindow.startDate).toBe("2026-06-20");
    expect(trafficWindow.endDate).toBe("2026-06-29");
    expect(trafficWindow.dates[5]).toMatchObject({
      date: "2026-06-25",
      slot: 6,
      isChronicleDate: true,
    });
  });

  it("keeps old chronicles fixed in slot 6", () => {
    const trafficWindow = buildTcdbCardTrafficWindow(
      "2026-01-10",
      "2026-06-29",
    );

    expect(trafficWindow.chronicleSlot).toBe(6);
    expect(trafficWindow.startDate).toBe("2026-01-05");
    expect(trafficWindow.endDate).toBe("2026-01-14");
    expect(trafficWindow.dates[5]).toMatchObject({
      date: "2026-01-10",
      slot: 6,
      isChronicleDate: true,
    });
  });

  it("always returns 10 calendar dates", () => {
    expect(
      buildTcdbCardTrafficWindow("2026-06-29", "2026-06-29").dates,
    ).toHaveLength(10);
    expect(
      buildTcdbCardTrafficWindow("2026-06-28", "2026-06-29").dates,
    ).toHaveLength(10);
    expect(
      buildTcdbCardTrafficWindow("2026-06-25", "2026-06-29").dates,
    ).toHaveLength(10);
    expect(
      buildTcdbCardTrafficWindow("2026-01-10", "2026-06-29").dates,
    ).toHaveLength(10);
  });

  it("fills missing traffic counts with zero", () => {
    const rows = buildTcdbCardTrafficRows(
      "2026-06-25",
      "2026-06-29",
      new Map([
        [
          "2026-06-24",
          {
            cardTotal: 12,
            tradeCount: 2,
          },
        ],
      ]),
    );

    expect(rows).toHaveLength(10);
    expect(rows[4]).toMatchObject({
      date: "2026-06-24",
      slot: 5,
      cardTotal: 12,
      tradeCount: 2,
    });
    expect(rows[5]).toMatchObject({
      date: "2026-06-25",
      slot: 6,
      cardTotal: 0,
      tradeCount: 0,
      isChronicleDate: true,
    });
  });

  it("normalizes date-prefixed strings and rejects invalid dates", () => {
    expect(normalizeTcdbCardTrafficDate("2026-06-29T12:00:00Z")).toBe(
      "2026-06-29",
    );
    expect(() => normalizeTcdbCardTrafficDate("2026-02-31")).toThrow(
      "valid calendar date",
    );
  });

  it("gets the server-side site date in Chicago time", () => {
    expect(getServerTodayDateString(new Date("2026-06-29T04:59:59Z"))).toBe(
      "2026-06-28",
    );
    expect(getServerTodayDateString(new Date("2026-06-29T05:00:00Z"))).toBe(
      "2026-06-29",
    );
  });
});
