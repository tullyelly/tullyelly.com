import { TagMetadataProvider } from "@/components/tags/TagLink";
import type React from "react";
import { render, screen } from "@testing-library/react";

const getScrollMock = jest.fn();
const getVolleyballTournamentDayByKeyAndDateMock = jest.fn();
const getTcdbTradeSummaryFromDbMock = jest.fn();
const getReviewSummaryFromDbMock = jest.fn();
const getBricksSummaryFromDbMock = jest.fn();
const getUspsSummaryFromDbMock = jest.fn();
const getLcsSummaryFromDbMock = jest.fn();

jest.mock("@/components/Tweet", () => ({
  XEmbed: () => null,
}));
jest.mock("server-only", () => ({}));
jest.mock("@/lib/review-db", () => ({
  getReviewSummaryFromDb: (...args: unknown[]) =>
    getReviewSummaryFromDbMock(...args),
}));
jest.mock("@/lib/bricks-db", () => ({
  getBricksSummaryFromDb: (...args: unknown[]) =>
    getBricksSummaryFromDbMock(...args),
}));
jest.mock("@/lib/usps-db", () => ({
  getUspsSummaryFromDb: (...args: unknown[]) =>
    getUspsSummaryFromDbMock(...args),
  normalizeUspsCitySlug: (value: string) =>
    value.trim().replace(/^\/+/g, "").replace(/\/+$/g, "").toLowerCase(),
}));
jest.mock("@/lib/lcs-db", () => ({
  getLcsSummaryFromDb: (...args: unknown[]) => getLcsSummaryFromDbMock(...args),
}));
jest.mock("@/lib/scrolls", () => ({
  getScroll: (...args: unknown[]) => getScrollMock(...args),
}));
jest.mock("@/lib/tcdb-trade-db", () => ({
  getTcdbTradeSummaryFromDb: (...args: unknown[]) =>
    getTcdbTradeSummaryFromDbMock(...args),
}));
jest.mock("@/lib/volleyball-tournament-db", () => ({
  getVolleyballTournamentDayByKeyAndDate: (...args: unknown[]) =>
    getVolleyballTournamentDayByKeyAndDateMock(...args),
  normalizeVolleyballTournamentKey: (value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error(
        "Volleyball tournament lookup: tournamentKey must be a non-empty string.",
      );
    }

    return normalized;
  },
  normalizeVolleyballTournamentDate: (value: string) => {
    const normalized = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new Error(
        "Volleyball tournament lookup: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
      );
    }

    const [year, month, day] = normalized
      .split("-")
      .map((segment) => Number.parseInt(segment, 10));
    const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    const daysInMonth = [
      31,
      isLeapYear ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    const maxDay = daysInMonth[month - 1];

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      !maxDay ||
      day < 1 ||
      day > maxDay
    ) {
      throw new Error(
        "Volleyball tournament lookup: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
      );
    }

    return normalized;
  },
}));

import ReleaseSection from "@/components/mdx/ReleaseSection";
import { formatReleaseDate } from "@/components/scrolls/formatReleaseDate";
import { mdxComponents } from "@/mdx-components";

const toRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const baseProps = {
  alterEgo: "mark2",
  children: <p>hello world</p>,
};

describe("ReleaseSection", () => {
  beforeEach(() => {
    getScrollMock.mockReset();
    getVolleyballTournamentDayByKeyAndDateMock.mockReset();
    getTcdbTradeSummaryFromDbMock.mockReset();
    getReviewSummaryFromDbMock.mockReset();
    getBricksSummaryFromDbMock.mockReset();
    getUspsSummaryFromDbMock.mockReset();
    getLcsSummaryFromDbMock.mockReset();

    getTcdbTradeSummaryFromDbMock.mockResolvedValue(null);
    getReviewSummaryFromDbMock.mockResolvedValue(null);
    getBricksSummaryFromDbMock.mockResolvedValue(null);
    getUspsSummaryFromDbMock.mockResolvedValue(null);
    getLcsSummaryFromDbMock.mockResolvedValue(null);
  });

  it("renders a plain section without a divider by default", async () => {
    const ui = await ReleaseSection(baseProps);
    const { container } = render(ui);

    expect(getScrollMock).not.toHaveBeenCalled();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText("#mark2")).toBeInTheDocument();
    expect(container.querySelector("hr")).not.toBeInTheDocument();
    expect(container.querySelector("[data-release-name]")).toBeNull();
    expect(container.querySelector(".relative")).toBeNull();
  });

  it("renders a divider when a plain section explicitly requests one", async () => {
    const ui = await ReleaseSection({ ...baseProps, divider: true });
    const { container } = render(ui);

    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("renders a source-order anchor with a persistent-header scroll offset", async () => {
    const ui = await ReleaseSection({ ...baseProps, sectionOrdinal: 2 });
    const { container } = render(ui);

    expect(container.querySelector("#release-section-2")).toHaveClass(
      "scroll-mt-24",
    );
  });

  it("requires tournamentDate when tournamentId is provided", async () => {
    await expect(
      ReleaseSection({
        ...baseProps,
        tournamentId: 1,
      }),
    ).rejects.toThrow(
      "ReleaseSection: tournamentDate is required when tournamentId is provided.",
    );

    expect(getVolleyballTournamentDayByKeyAndDateMock).not.toHaveBeenCalled();
  });

  it("requires tournamentId when tournamentDate is provided", async () => {
    await expect(
      ReleaseSection({
        ...baseProps,
        tournamentDate: "2026-02-14",
      }),
    ).rejects.toThrow(
      "ReleaseSection: tournamentId is required when tournamentDate is provided.",
    );

    expect(getVolleyballTournamentDayByKeyAndDateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid tournament ISO date strings before querying", async () => {
    await expect(
      ReleaseSection({
        ...baseProps,
        tournamentId: 1,
        tournamentDate: "2026-02-30",
      }),
    ).rejects.toThrow(
      "ReleaseSection: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
    );

    expect(getVolleyballTournamentDayByKeyAndDateMock).not.toHaveBeenCalled();
  });

  it("renders DB-backed volleyball tournament metadata", async () => {
    getVolleyballTournamentDayByKeyAndDateMock.mockResolvedValue({
      tournamentKey: "1",
      tournamentName: "Midwest Boys Point Series",
      tournamentDate: "2026-02-14",
      finish: null,
      wins: 2,
      losses: 1,
    });

    const ui = await ReleaseSection({
      alterEgo: "unclejimmy",
      children: <p>tournament report</p>,
      tournamentId: 1,
      tournamentDate: "2026-02-14",
    });
    const { container } = render(ui);

    expect(getVolleyballTournamentDayByKeyAndDateMock).toHaveBeenCalledWith(
      "1",
      "2026-02-14",
    );
    expect(screen.getByText("Record: 2-1")).toBeInTheDocument();

    const content = container.querySelector(
      "[data-tournament-id]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-tournament-id", "1");
    expect(content).toHaveAttribute("data-tournament-date", "2026-02-14");
    expect(content).toHaveAttribute(
      "data-tournament-name",
      "Midwest Boys Point Series",
    );
    expect(content).toHaveAttribute("data-tournament-record", "2-1");
  });

  it("renders the tournament trophy row at the bottom for first-place finishes", async () => {
    getVolleyballTournamentDayByKeyAndDateMock.mockResolvedValue({
      tournamentKey: "2",
      tournamentName: "Dale Rohde Tournament",
      tournamentDate: "2026-02-22",
      finish: 1,
      wins: 3,
      losses: 0,
    });

    const ui = await ReleaseSection({
      alterEgo: "unclejimmy",
      children: <p>champions</p>,
      tournamentId: 2,
      tournamentDate: "2026-02-22",
    });
    const { container } = render(ui);

    expect(screen.getByText("1st Place")).toBeInTheDocument();
    expect(container.querySelector('img[alt=""]')).toBeInTheDocument();

    const content = container.querySelector(
      "[data-tournament-id]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-tournament-finish", "1");
  });

  it("renders a fallback when the volleyball tournament day is missing", async () => {
    getVolleyballTournamentDayByKeyAndDateMock.mockResolvedValue(null);

    const ui = await ReleaseSection({
      ...baseProps,
      tournamentId: 1,
      tournamentDate: "2026-02-14",
    });
    const { container } = render(ui);

    expect(getVolleyballTournamentDayByKeyAndDateMock).toHaveBeenCalledWith(
      "1",
      "2026-02-14",
    );
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Volleyball tournament details are unavailable for tournament 1 on 2026-02-14.",
      ),
    ).toBeInTheDocument();

    const content = container.querySelector(
      "[data-tournament-status]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-tournament-id", "1");
    expect(content).toHaveAttribute("data-tournament-date", "2026-02-14");
    expect(content).toHaveAttribute("data-tournament-status", "unavailable");
    expect(content).not.toHaveAttribute("data-tournament-name");
    expect(content).not.toHaveAttribute("data-tournament-record");
    expect(container.querySelector("hr")).not.toBeInTheDocument();
    expect(
      container.querySelector(".rounded-lg.border-\\[4px\\]"),
    ).toBeInTheDocument();
  });

  it("renders shared review details from the unified review prop", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "golden-age",
        id: "little-red-barn",
        name: "Little Red Barn Antiques",
        url: "https://littleredbarn.example.com",
        rating: "9.2/10",
      },
    });
    const { container } = render(ui);

    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Antique Shop: Little Red Barn Antiques");
    expect(container.querySelector("footer")).toHaveTextContent("9.2/10");
    const shopLink = screen.getByText("Little Red Barn Antiques").closest("a");
    expect(shopLink).toBeInTheDocument();
    expect(shopLink).toHaveAttribute(
      "href",
      "https://littleredbarn.example.com",
    );
    expect(screen.queryByText("Legacy Shop")).toBeNull();

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper.className).toContain("border-solid");
    expect(wrapper.className).toContain("border-[var(--blue)]");

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-review-type", "golden-age");
    expect(content).toHaveAttribute("data-review-id", "little-red-barn");
    expect(content).toHaveAttribute(
      "data-review-name",
      "Little Red Barn Antiques",
    );
    expect(content).toHaveAttribute("data-review-rating", "9.2/10");
  });

  it("renders table schema details without release visuals and without loading scroll data", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "table-schema",
        id: "table-schema-42",
        name: "Pizza Shack",
        url: "https://pizzashack.example.com",
        rating: "9/10",
      },
    });
    const { container } = render(ui);

    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Table Schema: Pizza Shack");
    expect(container.querySelector("footer")).toHaveTextContent("9/10");
    const tableSchemaLink = screen.getByText("Pizza Shack").closest("a");
    expect(tableSchemaLink).toBeInTheDocument();
    expect(tableSchemaLink).toHaveAttribute(
      "href",
      "https://pizzashack.example.com",
    );
    expect(tableSchemaLink).toHaveAttribute("target", "_blank");
    expect(tableSchemaLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(getScrollMock).not.toHaveBeenCalled();
    expect(
      container.querySelector("[data-release-section-header]"),
    ).toBeInTheDocument();
    expect(container.querySelector(".tcdb-frame")).toBeNull();

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper.className).toContain("border-solid");
    expect(wrapper.className).toContain("border-[var(--blue)]");

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-review-type", "table-schema");
    expect(content).toHaveAttribute("data-review-id", "table-schema-42");
    expect(content).toHaveAttribute("data-review-name", "Pizza Shack");
    expect(content).toHaveAttribute("data-review-rating", "9/10");
  });

  it("renders save point details from the unified review prop", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "save-point",
        id: "chrono-trigger",
        name: "Chrono Trigger",
        url: "https://example.com/chrono-trigger",
        rating: "10/10",
      },
    });
    const { container } = render(ui);

    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Save Point: Chrono Trigger");
    expect(container.querySelector("footer")).toHaveTextContent("10/10");
    const savePointLink = screen.getByText("Chrono Trigger").closest("a");
    expect(savePointLink).toBeInTheDocument();
    expect(savePointLink).toHaveAttribute(
      "href",
      "https://example.com/chrono-trigger",
    );

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#0077C0") });

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-review-type", "save-point");
    expect(content).toHaveAttribute("data-review-id", "chrono-trigger");
    expect(content).toHaveAttribute("data-review-name", "Chrono Trigger");
    expect(content).toHaveAttribute("data-review-rating", "10/10");
  });

  it("supports minimal review props for future review types without requiring DB metadata", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "golden-age",
        id: "little-red-barn",
      },
    });
    const { container } = render(ui);

    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Antique Shop: little-red-barn");

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-review-type", "golden-age");
    expect(content).toHaveAttribute("data-review-id", "little-red-barn");
    expect(content).toHaveAttribute("data-review-name", "little-red-barn");
    expect(content).not.toHaveAttribute("data-review-rating");
  });

  it("resolves minimal review props from DB metadata when available", async () => {
    getReviewSummaryFromDbMock.mockResolvedValue({
      externalId: "little-red-barn",
      name: "Little Red Barn Antiques",
      averageRating: 8.8,
      visitCount: 1,
      latestPostDate: "2026-04-01",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "golden-age",
        id: "little-red-barn",
      },
    });
    const { container } = render(ui);

    expect(getReviewSummaryFromDbMock).toHaveBeenCalledWith(
      "golden-age",
      "little-red-barn",
    );
    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Antique Shop: Little Red Barn Antiques");
    expect(container.querySelector("footer")).toHaveTextContent("8.8/10");

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute(
      "data-review-name",
      "Little Red Barn Antiques",
    );
    expect(content).toHaveAttribute("data-review-rating", "8.8/10");
  });

  it("renders bricks LEGO details from DB-backed metadata with an internal route link", async () => {
    getBricksSummaryFromDbMock.mockResolvedValue({
      subset: "lego",
      publicId: "10330",
      setName: "McLaren MP4/4 & Ayrton Senna",
      tag: "f1",
      pieceCount: 693,
      reviewScore: 9.3,
      sessionCount: 2,
      firstBuildDate: "2026-04-01",
      latestBuildDate: "2026-04-03",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      bricks: "10330",
    });
    const { container } = render(ui);

    expect(getBricksSummaryFromDbMock).toHaveBeenCalledWith("lego", "10330");
    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("McLaren MP4/4 & Ayrton Senna");
    expect(container.querySelector("footer")).toHaveTextContent("9.3/10");
    expect(container.querySelector("footer")).toHaveTextContent(
      "LEGO ID: 10330",
    );
    expect(container.querySelector("footer")).toHaveTextContent("Pieces: 693");
    expect(container.querySelector("footer")).toHaveTextContent("Tag: f1");
    expect(
      container.querySelector('[data-person-tag="f1"]'),
    ).toBeInTheDocument();

    const setLink = screen
      .getByText("McLaren MP4/4 & Ayrton Senna")
      .closest("a");
    expect(setLink).toBeInTheDocument();
    expect(setLink).toHaveAttribute("href", "/unclejimmy/bricks/10330");
    expect(screen.getByRole("link", { name: "10330" })).toHaveAttribute(
      "href",
      "https://www.lego.com/en-ch/service/building-instructions/10330",
    );

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    const content = container.querySelector(
      "[data-bricks-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-bricks-id", "10330");
    expect(content).toHaveAttribute(
      "data-bricks-name",
      "McLaren MP4/4 & Ayrton Senna",
    );
    expect(content).toHaveAttribute("data-bricks-tag", "f1");
    expect(content).toHaveAttribute("data-bricks-piece-count", "693");
    expect(content).toHaveAttribute("data-bricks-review-score", "9.3/10");
    expect(content).toHaveAttribute(
      "data-bricks-route",
      "/unclejimmy/bricks/10330",
    );
  });

  it("supports authored bricks overrides when DB metadata is missing", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      bricks: {
        id: "42171",
        name: "Mercedes-AMG F1 W14",
        tag: "f1",
        pieceCount: 1642,
        reviewScore: 8.7,
      },
    });
    const { container } = render(ui);

    expect(
      container.querySelector("[data-release-section-header]"),
    ).toHaveTextContent("Mercedes-AMG F1 W14");
    expect(container.querySelector("footer")).toHaveTextContent("8.7/10");
    expect(container.querySelector("footer")).toHaveTextContent(
      "LEGO ID: 42171",
    );
    expect(container.querySelector("footer")).toHaveTextContent("Pieces: 1642");
    expect(container.querySelector("footer")).toHaveTextContent("Tag: f1");
    expect(screen.getByRole("link", { name: "42171" })).toHaveAttribute(
      "href",
      "https://www.lego.com/en-ch/service/building-instructions/42171",
    );
  });

  it("renders USPS details from DB-backed metadata with the total visit count", async () => {
    getUspsSummaryFromDbMock.mockResolvedValue({
      citySlug: "menasha",
      cityName: "Menasha",
      state: "Wisconsin",
      rating: 8.7,
      visitCount: 4,
      firstVisitDate: "2026-04-01",
      latestVisitDate: "2026-04-05",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      usps: " menasha ",
    });
    const { container } = render(ui);

    expect(getUspsSummaryFromDbMock).toHaveBeenCalledWith("menasha");
    expect(container).toHaveTextContent("Menasha, Wisconsin");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Rating: 8.7/10Visits: 4",
    );

    const uspsLink = screen.getByText("Menasha, Wisconsin").closest("a");
    expect(uspsLink).toBeInTheDocument();
    expect(uspsLink).toHaveAttribute("href", "/cardattack/usps/menasha");

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("border-solid");
    expect(wrapper.className).toContain("border-[var(--blue)]");

    const content = container.querySelector(
      "[data-usps-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-usps-id", "menasha");
    expect(content).toHaveAttribute("data-usps-name", "Menasha, Wisconsin");
    expect(content).toHaveAttribute("data-usps-rating", "8.7/10");
    expect(content).toHaveAttribute("data-usps-visit-count", "4");
    expect(content).toHaveAttribute(
      "data-usps-route",
      "/cardattack/usps/menasha",
    );
  });

  it("renders USPS details alongside release visuals when releaseId and usps are both passed", async () => {
    getScrollMock.mockResolvedValue({
      id: "55",
      release_name: "International Bricks",
      release_type: "year",
      status: "released",
      release_date: "2026-04-18",
      label: "International Bricks",
    });
    getUspsSummaryFromDbMock.mockResolvedValue({
      citySlug: "appleton-sdc",
      cityName: "Appleton",
      state: "Wisconsin",
      rating: 9.1,
      visitCount: 6,
      firstVisitDate: "2026-03-01",
      latestVisitDate: "2026-04-18",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "55",
      usps: " appleton-sdc ",
    });
    const { container } = render(ui);

    expect(getScrollMock).toHaveBeenCalledWith("55");
    expect(getUspsSummaryFromDbMock).toHaveBeenCalledWith("appleton-sdc");

    const tab = container.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute("href", "/mark2/shaolin-scrolls/55");
    expect(tab).toHaveTextContent("International Bricks");

    expect(container).toHaveTextContent("Appleton, Wisconsin");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Rating: 9.1/10Visits: 6",
    );

    const uspsLink = screen.getByText("Appleton, Wisconsin").closest("a");
    expect(uspsLink).toBeInTheDocument();
    expect(uspsLink).toHaveAttribute("href", "/cardattack/usps/appleton-sdc");

    const content = container.querySelector(
      "[data-usps-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute(
      "data-release-name",
      "International Bricks",
    );
    expect(content).toHaveAttribute("data-usps-id", "appleton-sdc");
    expect(content).toHaveAttribute("data-usps-name", "Appleton, Wisconsin");
    expect(content).toHaveAttribute("data-usps-rating", "9.1/10");
    expect(content).toHaveAttribute("data-usps-visit-count", "6");
  });

  it("renders LCS details from DB-backed metadata with an internal route link", async () => {
    getLcsSummaryFromDbMock.mockResolvedValue({
      slug: "walgreens-college",
      name: "Walgreens: College",
      city: "Appleton",
      state: "WI",
      rating: 6.5,
      url: "https://www.walgreens.com/",
      visitCount: 1,
      firstVisitDate: "2026-03-28",
      latestVisitDate: "2026-03-28",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      lcs: " walgreens-college ",
    });
    const { container } = render(ui);

    expect(getLcsSummaryFromDbMock).toHaveBeenCalledWith("walgreens-college");
    expect(container.querySelector("header")).toHaveTextContent(
      "Walgreens: College",
    );
    expect(container.querySelector("footer")).toHaveTextContent("Appleton, WI");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Rating: 6.5/10Visits: 1",
    );

    const lcsLink = screen.getByText("Walgreens: College").closest("a");
    expect(lcsLink).toBeInTheDocument();
    expect(lcsLink).toHaveAttribute(
      "href",
      "/cardattack/lcs/walgreens-college",
    );

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("border-solid");
    expect(wrapper.className).toContain("border-[var(--blue)]");

    const content = container.querySelector(
      "[data-lcs-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-lcs-slug", "walgreens-college");
    expect(content).toHaveAttribute("data-lcs-name", "Walgreens: College");
    expect(content).toHaveAttribute("data-lcs-city", "Appleton");
    expect(content).toHaveAttribute("data-lcs-state", "WI");
    expect(content).toHaveAttribute("data-lcs-rating", "6.5/10");
    expect(content).toHaveAttribute("data-lcs-visit-count", "1");
    expect(content).toHaveAttribute(
      "data-lcs-route",
      "/cardattack/lcs/walgreens-college",
    );
    expect(content).toHaveAttribute(
      "data-lcs-url",
      "https://www.walgreens.com/",
    );
  });

  it("renders LCS details alongside release visuals when releaseId and lcs are both passed", async () => {
    getScrollMock.mockResolvedValue({
      id: "55",
      release_name: "International Bricks",
      release_type: "year",
      status: "released",
      release_date: "2026-04-18",
      label: "International Bricks",
    });
    getLcsSummaryFromDbMock.mockResolvedValue({
      slug: "walgreens-college",
      name: "Walgreens: College",
      city: "Appleton",
      state: "WI",
      rating: 6.5,
      visitCount: 1,
      firstVisitDate: "2026-03-28",
      latestVisitDate: "2026-03-28",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "55",
      lcs: "walgreens-college",
    });
    const { container } = render(ui);

    expect(getScrollMock).toHaveBeenCalledWith("55");
    expect(getLcsSummaryFromDbMock).toHaveBeenCalledWith("walgreens-college");
    expect(container.querySelector("header")).toHaveTextContent(
      "International Bricks",
    );
    expect(container.querySelector("footer")).toHaveTextContent(
      "Walgreens: College",
    );
    expect(container.querySelector("footer")).toHaveTextContent("Appleton, WI");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Rating: 6.5/10Visits: 1",
    );

    const tab = container.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveAttribute("href", "/mark2/shaolin-scrolls/55");

    const content = container.querySelector(
      "[data-lcs-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute(
      "data-release-name",
      "International Bricks",
    );
    expect(content).toHaveAttribute("data-lcs-slug", "walgreens-college");
  });

  it("supports minimal lcs props when DB metadata is missing", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      lcs: "walgreens-college",
    });
    const { container } = render(ui);

    const lcsLink = screen.getByRole("link", { name: "walgreens-college" });
    expect(lcsLink).toBeInTheDocument();
    expect(lcsLink).toHaveAttribute(
      "href",
      "/cardattack/lcs/walgreens-college",
    );

    const content = container.querySelector(
      "[data-lcs-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-lcs-slug", "walgreens-college");
    expect(content).toHaveAttribute("data-lcs-name", "walgreens-college");
    expect(content).not.toHaveAttribute("data-lcs-rating");
    expect(content).not.toHaveAttribute("data-lcs-visit-count");
  });

  it("applies rainbowColour to eligible non-release sections", async () => {
    const rainbowColour = "#00FF00";
    const ui = await ReleaseSection({
      ...baseProps,
      rainbowColour,
      review: {
        type: "save-point",
        id: "chrono-trigger",
        name: "Chrono Trigger",
        rating: "9.2/10",
      },
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-rainbow-colour", rainbowColour);
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe(
      rainbowColour,
    );
    expect(content.style.getPropertyValue("--mdx-marker-color")).toBe(
      rainbowColour,
    );

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.style.getPropertyValue("--tab-bg")).toBe(rainbowColour);
    expect(tagPill.style.getPropertyValue("--tab-fg")).toBe("#000000");
    expect(tagPill.style.getPropertyValue("--tab-hover-fg")).toBe(
      rainbowColour,
    );

    expect(container.querySelector("hr")).toBeNull();
  });

  it("does not render a duplicate bottom divider for bordered USPS sections", async () => {
    getUspsSummaryFromDbMock.mockResolvedValue({
      citySlug: "menasha",
      cityName: "Menasha",
      state: "Wisconsin",
      rating: 10,
      visitCount: 1,
      firstVisitDate: "2026-04-01",
      latestVisitDate: "2026-04-01",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      usps: "menasha",
    });
    const { container } = render(ui);

    expect(container.querySelector("div.rounded-lg")).toBeInTheDocument();
    expect(container.querySelector("hr")).toBeNull();
  });

  it("wraps content with a release container and link tab when releaseId is provided", async () => {
    getScrollMock.mockResolvedValue({
      id: "12",
      release_name: "Minor Move",
      release_type: "year",
      status: "released",
      release_date: "2024-01-01",
      label: "Minor Move",
    });

    const rainbowColour = "#FF0000";
    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
      rainbowColour,
    });
    const { container } = render(ui);

    expect(getScrollMock).toHaveBeenCalledWith("12");

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });
    expect(wrapper.className).toContain("mb-10");

    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.tagName.toLowerCase()).toBe("a");
    expect(tab.getAttribute("href")).toBe("/mark2/shaolin-scrolls/12");
    expect(tab.className).toContain("no-underline");
    expect(tab.className).toContain("focus-visible:outline");
    expect(tab).toHaveStyle({ textDecoration: "none" });
    expect(tab).toHaveTextContent("Minor Move");
    expect(tab.className).toContain("bg-[var(--tab-bg)]");
    expect(tab.className).toContain("!text-[color:var(--tab-fg");
    expect(tab.className).toContain("hover:!bg-[color:var(--tab-hover-bg");
    expect(tab.className).toContain("hover:!text-[color:var(--tab-hover-fg");
    expect(tab.className).toContain(
      "focus-visible:!bg-[color:var(--tab-hover-bg",
    );
    expect(tab.className).toContain(
      "focus-visible:!text-[color:var(--tab-hover-fg",
    );
    expect(tab.style.getPropertyValue("--tab-bg")).toBe(rainbowColour);
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe(rainbowColour);

    const content = wrapper.querySelector(
      "[data-release-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-name", "Minor Move");
    expect(content).toHaveAttribute("data-release-type", "year");
    expect(content).toHaveAttribute("data-release-color", rainbowColour);
    expect(content).toHaveAttribute("data-rainbow-colour", rainbowColour);

    expect(container.querySelector("hr")).toBeNull();
  });

  it("does not call getScroll and renders tcdb trade tab + partner link", async () => {
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      tradeId: "359632",
      tradePartnerId: 42,
      partner: "collect-a-set",
      startDate: "2026-01-01",
      sectionCount: 1,
      status: "Open",
    });

    const rainbowColour = "#00FF00";
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
      rainbowColour,
    });
    const { container } = render(ui);

    expect(getScrollMock).not.toHaveBeenCalled();

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).not.toContain("tcdb-border");
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.getAttribute("href")).toBe("/cardattack/tcdb-trades/359632");
    expect(tab).toHaveTextContent("TCDb Trade: 359632");

    expect(screen.getByText("Trade Partner:")).toBeInTheDocument();
    const partnerLink = screen.getByText("collect-a-set").closest("a");
    expect(partnerLink).toBeInTheDocument();
    expect(partnerLink).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trade-partners/42",
    );
    expect(partnerLink).toHaveClass("link-blue");
    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenCalledWith("359632");
  });

  it("renders tcdb trade card counts from the DB summary helper", async () => {
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      tradeId: "359632",
      startDate: "2026-01-01",
      sectionCount: 1,
      status: "Open",
      received: 7,
      sent: 4,
      total: 11,
    });

    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
    });
    render(ui);

    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenCalledWith("359632");
    expect(screen.getByText("Total: 11")).toBeInTheDocument();
  });

  it("renders a completed link to the internal tcdb trade route", async () => {
    const tradeId = "359632";
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      tradeId,
      startDate: "2026-01-01",
      endDate: "2026-01-10",
      sectionCount: 2,
      status: "Completed",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });
    render(ui);

    const completionLink = screen.getByText("Completed").closest("a");
    expect(completionLink).toBeInTheDocument();
    expect(completionLink).toHaveAttribute(
      "href",
      `/cardattack/tcdb-trades/${tradeId}`,
    );
    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenCalledWith(tradeId);
  });

  it("propagates completed links to all tcdb sections sharing a tradeId", async () => {
    const tradeId = "812345";
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      tradeId,
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      sectionCount: 2,
      status: "Completed",
    });

    const incompleteSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });
    const completedSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });

    render(
      <>
        {incompleteSection}
        {completedSection}
      </>,
    );

    const completionLinks = screen
      .getAllByText("Completed")
      .map((node) => node.closest("a"))
      .filter((link): link is HTMLAnchorElement => Boolean(link));

    expect(completionLinks).toHaveLength(2);
    const hrefs = completionLinks.map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      `/cardattack/tcdb-trades/${tradeId}`,
      `/cardattack/tcdb-trades/${tradeId}`,
    ]);
    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenCalledTimes(2);
  });

  it("propagates DB-backed trade card counts to all tcdb sections sharing a tradeId", async () => {
    const tradeId = "812345";
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      tradeId,
      startDate: "2026-01-01",
      sectionCount: 1,
      status: "Open",
      received: 6,
      sent: 4,
      total: 10,
    });

    const incompleteSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });
    const completedSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });

    render(
      <>
        {incompleteSection}
        {completedSection}
      </>,
    );

    expect(screen.getAllByText("Total: 10")).toHaveLength(2);
    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenNthCalledWith(1, tradeId);
    expect(getTcdbTradeSummaryFromDbMock).toHaveBeenNthCalledWith(2, tradeId);
  });

  it("throws when both releaseId and tcdbTradeId are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({ ...baseProps, releaseId: "12", tcdbTradeId: "359632" }),
    ).rejects.toThrow("either releaseId or tcdbTradeId");
  });

  it("throws when both releaseId and review are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        releaseId: "12",
        review: {
          type: "table-schema" as const,
          id: "table-schema-42",
          name: "Pizza Shack",
          rating: "9/10",
        },
      }),
    ).rejects.toThrow("either releaseId or review");
  });

  it("throws when both tcdbTradeId and review are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        tcdbTradeId: "359632",
        review: {
          type: "table-schema" as const,
          id: "table-schema-42",
          name: "Pizza Shack",
          rating: "9/10",
        },
      }),
    ).rejects.toThrow("either tcdbTradeId or review");
  });

  it("throws when both review and bricks are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        review: {
          type: "table-schema" as const,
          id: "table-schema-42",
          name: "Pizza Shack",
          rating: "9/10",
        },
        bricks: "10330",
      }),
    ).rejects.toThrow("either review or bricks");
  });

  it("throws when both review and usps are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        review: {
          type: "table-schema" as const,
          id: "1",
          name: "Pizza Shack",
          rating: "9.0/10",
        },
        usps: "menasha",
      }),
    ).rejects.toThrow("either review or usps");
  });

  it("throws when both usps and lcs are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        usps: "menasha",
        lcs: "walgreens-college",
      }),
    ).rejects.toThrow("either usps or lcs");
  });

  it("throws when both releaseId and bricks are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        releaseId: "12",
        bricks: "10330",
      }),
    ).rejects.toThrow("either releaseId or bricks");
  });

  it("throws when both tcdbTradeId and bricks are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({
        ...baseProps,
        tcdbTradeId: "359632",
        bricks: "10330",
      }),
    ).rejects.toThrow("either tcdbTradeId or bricks");
  });

  it("applies rainbowColour when releaseId is present", async () => {
    getScrollMock.mockResolvedValue({
      id: "12",
      release_name: "Minor Move",
      release_type: "year",
      status: "released",
      release_date: "2024-01-01",
      label: "Minor Move",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
      rainbowColour: "#FF0000",
    });
    const { container } = render(ui);

    const content = container.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#FF0000");
    expect(content).toHaveAttribute("data-release-text-color", "#FFFFFF");
    expect(content).toHaveAttribute("data-rainbow-colour", "#FF0000");
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe(
      "#FF0000",
    );

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.style.getPropertyValue("--tab-bg")).toBe("#FF0000");
    expect(tagPill.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
  });

  it("applies rainbowColour when tcdbTradeId is present", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
      rainbowColour: "#FF0000",
    });
    const { container } = render(ui);

    const content = container.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#FF0000");
    expect(content).toHaveAttribute("data-release-text-color", "#FFFFFF");
    expect(content).toHaveAttribute("data-rainbow-colour", "#FF0000");
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe(
      "#FF0000",
    );

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.style.getPropertyValue("--tab-bg")).toBe("#FF0000");
    expect(tagPill.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
  });

  it("tcdb trade without partner renders tab without partner suffix and no bottom partner row", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveTextContent("TCDb Trade: 359632");

    expect(screen.queryByText("Trade Partner:")).toBeNull();
  });

  it("colors nested dividers to match the release border when releaseId is present", async () => {
    const Divider = mdxComponents.hr as React.ComponentType<
      React.ComponentPropsWithoutRef<"hr">
    >;
    getScrollMock.mockResolvedValue({
      id: "12",
      release_name: "Minor Move",
      release_type: "year",
      status: "released",
      release_date: "2024-01-01",
      label: "Minor Move",
    });

    const rainbowColour = "#EC008C";
    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
      rainbowColour,
      children: (
        <>
          <p>hello world</p>
          <Divider />
        </>
      ),
    });
    const { container } = render(ui);

    const content = container.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe(
      rainbowColour,
    );

    const divider = content.querySelector("hr") as HTMLHRElement;
    expect(divider).toBeInTheDocument();
    expect(divider.style.backgroundColor).toBe(
      "var(--mdx-divider-color, var(--blue))",
    );
  });

  it("uses the release border color for bullets and tag pills when releaseId is present", async () => {
    const List = mdxComponents.ul as React.ComponentType<
      React.ComponentPropsWithoutRef<"ul">
    >;
    const ListItem = mdxComponents.li as React.ComponentType<
      React.ComponentPropsWithoutRef<"li">
    >;
    getScrollMock.mockResolvedValue({
      id: "12",
      release_name: "Minor Move",
      release_type: "year",
      status: "released",
      release_date: "2024-01-01",
      label: "Minor Move",
    });

    const rainbowColour = "#EC008C";
    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
      rainbowColour,
      children: (
        <List>
          <ListItem>alpha</ListItem>
        </List>
      ),
    });
    const { container } = render(ui);

    const content = container.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content.style.getPropertyValue("--mdx-marker-color")).toBe(
      rainbowColour,
    );

    const list = container.querySelector("ul") as HTMLUListElement;
    expect(list.className).toContain(
      "marker:text-[color:var(--mdx-marker-color,var(--blue))]",
    );

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.style.getPropertyValue("--tab-bg")).toBe(rainbowColour);
    expect(tagPill.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tagPill.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tagPill.style.getPropertyValue("--tab-hover-fg")).toBe(
      rainbowColour,
    );
  });

  it("uses rainbow colour for chore releases", async () => {
    getScrollMock.mockResolvedValue({
      id: "41",
      release_name: "Chore Cleanup",
      release_type: "chore",
      status: "planned",
      release_date: null,
      label: "Chore Cleanup",
    });

    const rainbowColour = "#123456";
    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "41",
      rainbowColour,
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.style.getPropertyValue("--tab-bg")).toBe(rainbowColour);
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe(rainbowColour);

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", rainbowColour);
    expect(content).toHaveAttribute("data-release-text-color", "#FFFFFF");
  });

  it("does not apply wax-specific chrome classes when rainbow is provided", async () => {
    getScrollMock.mockResolvedValue({
      id: "77",
      release_name: "Foil Drop",
      release_type: "wax",
      status: "released",
      release_date: "2024-05-01",
      label: "Foil Drop",
    });

    const rainbowColour = "#008000";
    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "77",
      rainbowColour,
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).not.toContain("chrome-foil-border");
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.style.getPropertyValue("--tab-bg")).toBe(rainbowColour);
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe(rainbowColour);
    expect(tab.className).not.toContain("chrome-foil-shimmer");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", rainbowColour);
    expect(content).toHaveAttribute("data-release-text-color", "#FFFFFF");

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.className).not.toContain("chrome-foil-shimmer");
  });

  it("falls back to the base rainbow default when release_type is unknown", async () => {
    getScrollMock.mockResolvedValue({
      id: "99",
      release_name: "Mystery",
      release_type: "unknown",
      status: "planned",
      release_date: null,
      label: "Mystery",
    });

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "99",
      divider: false,
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#0077C0") });
    expect(wrapper.className).not.toContain("mb-10");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#0077C0");
    const tab = wrapper.querySelector(
      "[data-release-section-header] a",
    ) as HTMLAnchorElement;
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#0077C0");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#0077C0");
    expect(tab.className).toContain("!text-[color:var(--tab-fg");
    expect(tab.className).toContain("hover:!text-[color:var(--tab-hover-fg");

    expect(container.querySelector("hr")).toBeNull();
  });
  it("keeps unlinked review headers static and all metadata in the closing footer", async () => {
    const { container } = render(
      await ReleaseSection({
        ...baseProps,
        guestMage: "Guest Writer",
        rainbowColour: "#FFFF00",
        review: { type: "save-point", id: "unknown", rating: 0 },
      }),
    );
    const header = container.querySelector("header")!;
    expect(header).toHaveTextContent("Save Point: unknown");
    expect(header.querySelector("a")).toBeNull();
    expect(header.closest("section")).toBe(
      container.querySelector("footer")?.closest("section"),
    );
    expect(header).not.toHaveTextContent("›");
    expect(header.innerHTML).not.toContain("hover:");
    expect(container.querySelector("footer")).toHaveTextContent("Rating: 0");
    expect(container.querySelector("footer")).toHaveTextContent("#mark2");
    expect(
      screen
        .getByText("Guest Mage: Guest Writer")
        .compareDocumentPosition(screen.getByText("hello world")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each([
    { releaseId: "55" },
    { tcdbTradeId: "359632" },
    { review: { type: "save-point" as const, id: "game" } },
    { bricks: "10330" },
    { usps: "menasha" },
    { lcs: "shop" },
  ])("preserves supplemental tournament metadata with %j", async (subject) => {
    getVolleyballTournamentDayByKeyAndDateMock.mockResolvedValue({
      tournamentKey: "2",
      tournamentName: "Tournament name",
      tournamentDate: "2026-02-22",
      wins: 3,
      losses: 0,
      finish: 1,
    });
    const { container } = render(
      await ReleaseSection({
        ...baseProps,
        ...subject,
        tournamentId: "2",
        tournamentDate: "2026-02-22",
      }),
    );
    expect(container.querySelectorAll("header")).toHaveLength(1);
    expect(container.querySelector("footer")).toHaveTextContent("Record: 3-0");
    expect(container.querySelector("footer")).toHaveTextContent("1st Place");
    expect(container.querySelector("footer img")).toBeInTheDocument();
  });

  it("keeps the trade partner exclusively in the footer", async () => {
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      partner: "Partner",
      tradePartnerId: 42,
      received: 0,
      sent: 2,
      total: 2,
      sectionCount: 2,
      status: "Completed",
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, tcdbTradeId: "359632" }),
    );
    expect(container.querySelector("header")).not.toHaveTextContent("Partner");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Trade Partner: Partner",
    );
    expect(container.querySelector("footer")).toHaveTextContent(
      "Total: 2Sent: 2Received: 0",
    );
    expect(container.querySelector("footer")).toHaveTextContent(
      "Status: Completed",
    );
  });
  it.each([
    {},
    { releaseId: "55" },
    { review: { type: "save-point" as const, id: "unknown" } },
    { usps: "unknown" },
    { lcs: "unknown" },
    { tcdbTradeId: "unknown" },
  ])(
    "omits the separator and empty metadata area for persona-only footers: %j",
    async (subject) => {
      const { container } = render(
        await ReleaseSection({ ...baseProps, ...subject }),
      );
      const footer = container.querySelector("footer")!;
      expect(footer).not.toHaveClass("border-t-2", "pt-4", "gap-4");
      expect(footer).toHaveTextContent("#mark2");
      expect(footer.children).toHaveLength(1);
    },
  );

  it.each([{ usps: "menasha" }, { lcs: "shop" }])(
    "retains the separator for supplemental release metadata: %j",
    async (subject) => {
      const { container } = render(
        await ReleaseSection({ ...baseProps, releaseId: "55", ...subject }),
      );
      expect(container.querySelector("footer")).toHaveClass(
        "border-t-2",
        "pt-4",
      );
    },
  );

  it("retains the separator for review ratings, including zero", async () => {
    const { container } = render(
      await ReleaseSection({
        ...baseProps,
        review: { type: "save-point", id: "unknown", rating: 0 },
      }),
    );
    expect(container.querySelector("footer")).toHaveClass("border-t-2", "pt-4");
    expect(container.querySelector("footer")).toHaveTextContent("Rating: 0");
  });
  it.each([
    { releaseId: "55" },
    { review: { type: "save-point" as const, id: "unknown" } },
  ])(
    "fills the ribbon corner inside the rounded section border: %j",
    async (subject) => {
      const { container } = render(
        await ReleaseSection({ ...baseProps, ...subject }),
      );
      const ribbon = container.querySelector("header")!.firstElementChild!;
      expect(ribbon).not.toHaveClass("rounded-tl-md");
      expect(ribbon).toHaveClass("rounded-br-md", "border-t-0", "border-l-0");
      expect(container.querySelector("div.rounded-lg")).toBeInTheDocument();
    },
  );
  it("renders returned scroll metadata only in the footer using the release date formatter", async () => {
    getScrollMock.mockResolvedValue({
      id: " 55 ",
      release_name: " Release name ",
      release_type: " hotfix ",
      status: " Planned ",
      release_date: " 2026-09-29 ",
      label: " Sprint 42 ",
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, releaseId: "55" }),
    );
    const footer = container.querySelector("footer")!;
    expect(footer).toHaveTextContent("Status: Planned");
    expect(footer).toHaveTextContent("Type: hotfix");
    expect(footer).toHaveTextContent(
      `Date: ${formatReleaseDate("2026-09-29")}`,
    );
    expect(footer).toHaveTextContent("Release ID: 55");
    expect(footer).toHaveTextContent("Label: Sprint 42");
    expect(footer).not.toHaveTextContent("Name:");
    expect(footer).not.toHaveTextContent("completed");
    expect(footer).toHaveClass("border-t-2");
    expect(container.querySelector("header")).toHaveTextContent("Release name");
    expect(container.querySelector("header a")).toHaveAttribute(
      "href",
      "/mark2/shaolin-scrolls/55",
    );
    expect(getScrollMock).toHaveBeenCalledTimes(1);
  });

  it.each([" Release name ", " Planned ", " hotfix ", " 55 "])(
    "omits a redundant release label: %j",
    async (label) => {
      getScrollMock.mockResolvedValue({
        id: "55",
        release_name: "Release name",
        release_type: "hotfix",
        status: "Planned",
        label,
      });
      const { container } = render(
        await ReleaseSection({ ...baseProps, releaseId: "55" }),
      );
      expect(container.querySelector("footer")).not.toHaveTextContent("Label:");
      expect(container.querySelector("footer")).not.toHaveTextContent("Name:");
    },
  );

  it.each([null, "", "   "])(
    "omits missing scroll metadata without adding a separator: %j",
    async (value) => {
      getScrollMock.mockResolvedValue({
        id: value,
        release_name: "Release name",
        release_type: value,
        status: value,
        release_date: value,
        label: value,
      });
      const { container } = render(
        await ReleaseSection({ ...baseProps, releaseId: "55" }),
      );
      expect(container.querySelector("footer")).toHaveTextContent("#mark2");
      expect(container.querySelector("footer")).not.toHaveClass("border-t-2");
      expect(container.querySelector("footer")!.textContent).toBe("#mark2");
    },
  );

  it("omits the release ID when the unchanged header already displays it", async () => {
    getScrollMock.mockResolvedValue({
      id: " 55 ",
      release_name: null,
      status: "Open",
      label: " 55 ",
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, releaseId: "55" }),
    );
    expect(container.querySelector("header")).toHaveTextContent("55");
    expect(container.querySelector("footer")!.textContent).toBe(
      "Status: Open#mark2",
    );
  });

  it.each([{ usps: "menasha" }, { lcs: "shop" }])(
    "keeps entity details alongside scroll metadata: %j",
    async (subject) => {
      getScrollMock.mockResolvedValue({
        id: "55",
        release_name: "Release name",
        status: "Open",
        release_type: "chore",
        label: "Release name",
      });
      getUspsSummaryFromDbMock.mockResolvedValue({
        cityName: "Menasha",
        state: "Wisconsin",
        rating: 8.7,
        visitCount: 4,
      });
      getLcsSummaryFromDbMock.mockResolvedValue({
        name: "Local Shop",
        city: "Appleton",
        state: "WI",
        rating: 8,
        visitCount: 1,
      });
      const { container } = render(
        await ReleaseSection({ ...baseProps, releaseId: "55", ...subject }),
      );
      const footer = container.querySelector("footer")!;
      expect(footer).toHaveTextContent("Status: Open");
      expect(footer).toHaveTextContent("Type: chore");
      expect(footer.querySelector("a.link-blue")).toHaveAttribute(
        "href",
        "usps" in subject ? "/cardattack/usps/menasha" : "/cardattack/lcs/shop",
      );
      expect(footer).toHaveTextContent(
        "usps" in subject ? "Visits: 4" : "Visits: 1",
      );
      expect(footer).not.toHaveTextContent("Label:");
    },
  );
  it("omits a scroll label repeated by supplemental entity details", async () => {
    getScrollMock.mockResolvedValue({
      id: "55",
      release_name: "Release name",
      label: " Menasha, Wisconsin ",
    });
    getUspsSummaryFromDbMock.mockResolvedValue({
      cityName: "Menasha",
      state: "Wisconsin",
      visitCount: 1,
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, releaseId: "55", usps: "menasha" }),
    );
    expect(container.querySelector("footer")).not.toHaveTextContent("Label:");
    expect(container.querySelector("footer")).toHaveTextContent(
      "Menasha, Wisconsin",
    );
  });
  it("lets scroll metadata wrap horizontally while reserving the persona column", async () => {
    getScrollMock.mockResolvedValue({
      id: "55",
      release_name: "Release name",
      status: "planned",
      release_type: "planned",
      label: "A very long label",
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, releaseId: "55" }),
    );
    expect(
      container.querySelector("[data-release-section-metadata]"),
    ).toHaveClass("flex-1", "min-w-0", "sm:flex-row", "sm:flex-wrap");
    expect(screen.getByText("#mark2").closest("a")!.parentElement).toHaveClass(
      "shrink-0",
      "sm:ml-auto",
    );
    expect(container.querySelector("footer")).toHaveTextContent(
      "Status: planned",
    );
    expect(container.querySelector("footer")).toHaveTextContent(
      "Label: A very long label",
    );
  });
  it("renders trade counts in total/sent/received order and labels the completion link", async () => {
    getTcdbTradeSummaryFromDbMock.mockResolvedValue({
      partner: "Partner",
      tradePartnerId: 42,
      received: 102,
      sent: 118,
      total: 220,
      sectionCount: 2,
      status: "Completed",
    });
    const { container } = render(
      await ReleaseSection({ ...baseProps, tcdbTradeId: "877264" }),
    );
    const metadata = container.querySelector(
      "[data-release-section-metadata]",
    )!;
    expect(
      Array.from(metadata.children).map((item) => item.textContent),
    ).toEqual([
      "Total: 220",
      "Sent: 118",
      "Received: 102",
      "Trade Partner: Partner",
      "Status: Completed",
    ]);
    expect(metadata).not.toHaveTextContent("877264");
    expect(metadata).not.toHaveTextContent("Card Traffic");
    expect(screen.getByText("Completed").closest("a")).toHaveAttribute(
      "href",
      "/cardattack/tcdb-trades/877264",
    );
  });

  it("gives every LEGO value its own labeled item and shared spacing", async () => {
    const { container } = render(
      await ReleaseSection({
        ...baseProps,
        bricks: {
          id: "76345",
          name: "doctor DOOM bust",
          reviewScore: 9.2,
          pieceCount: 379,
          tag: "marvel",
        },
      }),
    );
    const metadata = container.querySelector(
      "[data-release-section-metadata]",
    )!;
    expect(
      Array.from(metadata.children).map((item) => item.textContent),
    ).toEqual([
      "Rating: 9.2/10",
      "LEGO ID: 76345",
      "Pieces: 379",
      "Tag: marvel",
    ]);
    expect(screen.getByText("76345").closest("a")).toHaveAttribute(
      "href",
      "https://www.lego.com/en-ch/service/building-instructions/76345",
    );
    expect(
      container.querySelector('[data-person-tag="marvel"]'),
    ).toBeInTheDocument();
  });
});

it.each([true, false])(
  "resolves the alter-ego badge using the server snapshot; clickable %s",
  async (isClickable) => {
    const ui = await ReleaseSection({ alterEgo: "mark2", children: "Body" });
    render(
      <TagMetadataProvider
        metadata={{
          mark2: { href: "/stored-persona", hrefKind: "tag", isClickable },
        }}
      >
        {ui}
      </TagMetadataProvider>,
    );
    if (isClickable)
      expect(screen.getByRole("link", { name: "#mark2" })).toHaveAttribute(
        "href",
        "/stored-persona",
      );
    else {
      expect(screen.queryByRole("link", { name: "#mark2" })).toBeNull();
      expect(screen.getByText("#mark2")).toBeInTheDocument();
    }
  },
);
