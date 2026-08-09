/** @jest-environment node */

const mockQuery = jest.fn();

jest.mock("@/db/pool", () => ({
  getPool: () => ({ query: mockQuery }),
}));

jest.mock("contentlayer/generated", () => ({
  allPosts: [
    {
      draft: false,
      date: "2026-04-05T00:00:00.000Z",
      slug: "older-chronicle",
      title: "Older Chronicle",
      summary: "Published before this release.",
      url: "/shaolin/older-chronicle",
      body: {
        raw: '<ScrollAmendment date="2026-04-12">Changed later.</ScrollAmendment>',
      },
    },
    {
      draft: false,
      date: "2026-04-13T00:00:00.000Z",
      slug: "current-chronicle",
      title: "Current Chronicle",
      summary: "Published in this release.",
      url: "/shaolin/current-chronicle",
      body: { raw: "Body" },
    },
  ],
}));

import {
  getShaolinReleaseDetail,
  listChronicleReleaseActivity,
} from "@/lib/shaolin-release-detail";

describe("Shaolin release detail", () => {
  beforeEach(() => mockQuery.mockReset());

  it("places later amendments in the current window without republishing the Chronicle", () => {
    const activity = listChronicleReleaseActivity("2026-04-11", "2026-04-18");
    expect(activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "chronicle_amendment",
          title: "Older Chronicle",
          date: "2026-04-12",
        }),
        expect.objectContaining({
          type: "chronicle",
          title: "Current Chronicle",
          date: "2026-04-13",
        }),
      ]),
    );
    expect(activity).not.toContainEqual(
      expect.objectContaining({ type: "chronicle", title: "Older Chronicle" }),
    );
  });

  it("loads the release window and keeps sent and received trade activity separate", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 12,
            release_name: "shaolin 1.2.0 minor: test",
            label: "test",
            semver: "v1.2.0",
            status: "released",
            release_type: "minor",
            release_date: "2026-04-18",
            activity_start_date: "2026-04-11",
            activity_end_date: "2026-04-18",
            is_in_progress: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            activity_date: new Date("2026-04-14T00:00:00.000Z"),
            activity_type: "tcdb_trade",
            activity_subtype: "sent",
            source_id: "100",
            title: "Partner A",
            activity_value: 10,
            destination_path: "/cardattack/tcdb-trades/100",
            metadata: { sent: 10 },
          },
          {
            activity_date: "2026-04-17",
            activity_type: "tcdb_trade",
            activity_subtype: "received",
            source_id: "101",
            title: "Partner B",
            activity_value: 8,
            destination_path: "/cardattack/tcdb-trades/101",
            metadata: { received: 8 },
          },
        ],
      });

    const detail = await getShaolinReleaseDetail("12");
    expect(detail?.activityStartDate).toBe("2026-04-11");
    expect(detail?.activityEndDate).toBe("2026-04-18");
    expect(detail?.activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "tcdb_trade", subtype: "sent" }),
        expect.objectContaining({ type: "tcdb_trade", subtype: "received" }),
      ]),
    );
    expect(detail?.activity).toEqual(
      expect.arrayContaining([expect.objectContaining({ date: "2026-04-14" })]),
    );
  });

  it("returns null for an invalid release", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(getShaolinReleaseDetail("999")).resolves.toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("does not use PostgreSQL WINDOW as the release-window alias", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await getShaolinReleaseDetail("12");
    const query = String(mockQuery.mock.calls[0]?.[0]);
    expect(query).not.toMatch(/\bwindow\./i);
    expect(query).toContain(
      "JOIN dojo.v_shaolin_release_window release_window",
    );
  });
});
