import { render, screen } from "@testing-library/react";
const homieSnapshotMock = jest.fn();
const clanSnapshotMock = jest.fn();
jest.mock("server-only", () => ({}));
jest.mock("@/lib/data/tcdb-snapshot", () => ({
  getTcdbSnapshotForTagOnDate: (...args: unknown[]) =>
    homieSnapshotMock(...args),
}));
jest.mock("@/lib/data/tcdb-clan-snapshot", () => ({
  getClanSnapshotsForTagOnDate: (...args: unknown[]) =>
    clanSnapshotMock(...args),
}));
import TcdbSnapshot from "@/components/mdx/TcdbSnapshot";
import ClanSnapshot from "@/components/mdx/ClanSnapshot";

const metadata = {
  href: "/stored-tag",
  hrefKind: "external",
  isClickable: true,
};
const snapshot = {
  displayName: "Snapshot label",
  ranking: 1,
  cardCount: 10,
  trend: "up",
  trendOverall: "up",
  routeSlug: "ranking",
  slug: "ranking",
  clanId: "1",
  sport: "basketball",
  rankingAt: "2026-10-05",
};

beforeEach(() => {
  homieSnapshotMock.mockReset();
  clanSnapshotMock.mockReset();
});
it.each(["success", "missing", "error"])(
  "uses the same tag destination in %s snapshot states and keeps ranking navigation",
  async (state) => {
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    if (state === "error") {
      homieSnapshotMock.mockRejectedValue(new Error("unavailable"));
      clanSnapshotMock.mockRejectedValue(new Error("unavailable"));
    } else {
      homieSnapshotMock.mockResolvedValue(
        state === "success" ? snapshot : null,
      );
      clanSnapshotMock.mockResolvedValue(state === "success" ? [snapshot] : []);
    }
    render(
      <>
        {await TcdbSnapshot({
          tag: "homie",
          snapshotDate: "2026-10-05",
          metadata,
        })}
        {await ClanSnapshot({
          tag: "clan",
          snapshotDate: "2026-10-05",
          metadata,
          href: "/authored",
        })}
      </>,
    );
    const label = state === "success" ? "snapshot label" : /homie|clan/;
    for (const link of screen.getAllByRole("link", { name: label }))
      expect(link).toHaveAttribute("href", "/stored-tag");
    expect(screen.getAllByRole("link", { name: label })).toHaveLength(2);
    if (state === "success") {
      const ranks = screen.getAllByRole("link", { name: "1st" });
      expect(ranks.map((link) => link.getAttribute("href"))).toEqual([
        "/cardattack/homies/ranking",
        "/cardattack/clans/ranking",
      ]);
    }
    errorLog.mockRestore();
  },
);

it.each(["success", "missing", "error"])(
  "does not restore disabled tag labels in %s snapshot states",
  async (state) => {
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    if (state === "error") {
      homieSnapshotMock.mockRejectedValue(new Error("unavailable"));
      clanSnapshotMock.mockRejectedValue(new Error("unavailable"));
    } else {
      homieSnapshotMock.mockResolvedValue(
        state === "success" ? snapshot : null,
      );
      clanSnapshotMock.mockResolvedValue(state === "success" ? [snapshot] : []);
    }
    const disabled = { ...metadata, href: null, isClickable: false };
    render(
      <>
        {await TcdbSnapshot({
          tag: "homie",
          snapshotDate: "2026-10-05",
          metadata: disabled,
        })}
        {await ClanSnapshot({
          tag: "clan",
          snapshotDate: "2026-10-05",
          metadata: disabled,
        })}
      </>,
    );
    expect(
      screen.queryByRole("link", { name: /snapshot label|homie|clan/ }),
    ).toBeNull();
    expect(
      screen.getAllByText(
        state === "success" ? "snapshot label" : /^(homie|clan)$/,
      ),
    ).toHaveLength(2);
    errorLog.mockRestore();
  },
);
