import type React from "react";
import { render, screen } from "@testing-library/react";

const getScrollMock = jest.fn();
const allPostsMock: Array<{
  body: { raw: string };
  slug: string;
  url: string;
  date: string;
}> = [];

jest.mock("@/components/Tweet", () => ({
  XEmbed: () => null,
}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  get allPosts() {
    return allPostsMock;
  },
}));
jest.mock("@/lib/scrolls", () => ({
  getScroll: (...args: unknown[]) => getScrollMock(...args),
}));

import ReleaseSection from "@/components/mdx/ReleaseSection";
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
    allPostsMock.length = 0;
  });

  it("renders the default layout when releaseId is missing", async () => {
    const ui = await ReleaseSection(baseProps);
    const { container } = render(ui);

    expect(getScrollMock).not.toHaveBeenCalled();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText("#mark2")).toBeInTheDocument();
    expect(container.querySelector("hr")).toBeInTheDocument();
    expect(container.querySelector("[data-release-name]")).toBeNull();
    expect(container.querySelector(".relative")).toBeNull();
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

    const ui = await ReleaseSection({ ...baseProps, releaseId: "12" });
    const { container } = render(ui);

    expect(getScrollMock).toHaveBeenCalledWith("12");

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#00471B") });
    expect(wrapper.className).toContain("mb-10");

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
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
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#00471B");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#EEE1C6");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#00471B");

    const content = wrapper.querySelector(
      "[data-release-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-name", "Minor Move");
    expect(content).toHaveAttribute("data-release-type", "year");
    expect(content).toHaveAttribute("data-release-color", "#00471B");

    expect(container.querySelector("hr")).toBeNull();
  });

  it("does not call getScroll and renders tcdb trade tab + partner link", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
      tcdbTradePartner: "collect-a-set",
    });
    const { container } = render(ui);

    expect(getScrollMock).not.toHaveBeenCalled();

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("tcdb-border");

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.getAttribute("href")).toBe(
      "https://www.tcdb.com/Transactions.cfm?MODE=VIEW&TransactionID=359632&PageIndex=1",
    );
    expect(tab).toHaveTextContent("TCDb Trade: 359632; Partner collect-a-set");

    expect(screen.getByText("Trade Partner:")).toBeInTheDocument();
    const partnerLink = screen.getByText("collect-a-set").closest("a");
    expect(partnerLink).toBeInTheDocument();
    expect(partnerLink).toHaveAttribute(
      "href",
      "https://www.tcdb.com/Profile.cfm/collect-a-set",
    );
    expect(partnerLink).toHaveClass("link-blue");
  });

  it("renders a completed link to the original trade post", async () => {
    const tradeId = "359632";
    allPostsMock.push(
      {
        slug: "followup-trade",
        url: "/shaolin/followup-trade",
        date: "2024-02-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>`,
        },
      },
      {
        slug: "original-trade",
        url: "/shaolin/original-trade",
        date: "2024-01-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">`,
        },
      },
    );

    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
      completed: true,
    });
    render(ui);

    const completionLink = screen
      .getByText(`${tradeId}: completed`)
      .closest("a");
    expect(completionLink).toBeInTheDocument();
    expect(completionLink).toHaveAttribute("href", "/shaolin/original-trade");
  });

  it("propagates completed links to all tcdb sections sharing a tradeId", async () => {
    const tradeId = "812345";
    allPostsMock.push(
      {
        slug: "original-trade",
        url: "/shaolin/original-trade",
        date: "2024-01-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}">`,
        },
      },
      {
        slug: "completed-trade",
        url: "/shaolin/completed-trade",
        date: "2024-02-01",
        body: {
          raw: `<ReleaseSection alterEgo="mark2" tcdbTradeId="${tradeId}" completed>`,
        },
      },
    );

    const incompleteSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
    });
    const completedSection = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: tradeId,
      completed: true,
    });

    render(
      <>
        {incompleteSection}
        {completedSection}
      </>,
    );

    const completionLinks = screen
      .getAllByText(`${tradeId}: completed`)
      .map((node) => node.closest("a"))
      .filter((link): link is HTMLAnchorElement => Boolean(link));

    expect(completionLinks).toHaveLength(2);
    const hrefs = completionLinks.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/shaolin/original-trade");
    expect(hrefs).toContain("/shaolin/completed-trade");
  });

  it("throws when both releaseId and tcdbTradeId are passed", async () => {
    await expect(
      // @ts-expect-error - runtime guard should reject mutually exclusive props.
      ReleaseSection({ ...baseProps, releaseId: "12", tcdbTradeId: "359632" }),
    ).rejects.toThrow("either releaseId or tcdbTradeId");
  });

  it("tcdb trade without partner renders tab without partner suffix and no bottom partner row", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
    });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
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

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
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
      "#00471B",
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

    const ui = await ReleaseSection({
      ...baseProps,
      releaseId: "12",
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
      "#00471B",
    );

    const list = container.querySelector("ul") as HTMLUListElement;
    expect(list.className).toContain(
      "marker:text-[color:var(--mdx-marker-color,var(--blue))]",
    );

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.style.getPropertyValue("--tab-bg")).toBe("#00471B");
    expect(tagPill.style.getPropertyValue("--tab-fg")).toBe("#EEE1C6");
    expect(tagPill.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tagPill.style.getPropertyValue("--tab-hover-fg")).toBe("#00471B");
  });

  it("uses Bucks purple for chore releases", async () => {
    getScrollMock.mockResolvedValue({
      id: "41",
      release_name: "Chore Cleanup",
      release_type: "chore",
      status: "planned",
      release_date: null,
      label: "Chore Cleanup",
    });

    const ui = await ReleaseSection({ ...baseProps, releaseId: "41" });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#702F8A") });

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#702F8A");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#702F8A");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#702F8A");
    expect(content).toHaveAttribute("data-release-text-color", "#FFFFFF");
  });

  it("uses the chrome foil palette for wax releases", async () => {
    getScrollMock.mockResolvedValue({
      id: "77",
      release_name: "Foil Drop",
      release_type: "wax",
      status: "released",
      release_date: "2024-05-01",
      label: "Foil Drop",
    });

    const ui = await ReleaseSection({ ...baseProps, releaseId: "77" });
    const { container } = render(ui);

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("chrome-foil-border");
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#AEB4BD") });

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
    expect(tab).toBeInTheDocument();
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#AEB4BD");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#0C1B0C");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#F7F9FC");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#0C1B0C");
    expect(tab.className).toContain("chrome-foil-shimmer");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#AEB4BD");
    expect(content).toHaveAttribute("data-release-text-color", "#0C1B0C");

    const tagPill = screen
      .getByText("#mark2")
      .closest("a") as HTMLAnchorElement;
    expect(tagPill.className).toContain("chrome-foil-shimmer");
  });

  it("falls back to the archived color when release_type is unknown and divider can be suppressed", async () => {
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

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#EEE1C6") });
    expect(wrapper.className).not.toContain("mb-10");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#EEE1C6");
    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#EEE1C6");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#000000");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#000000");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#EEE1C6");
    expect(tab.className).toContain("!text-[color:var(--tab-fg");
    expect(tab.className).toContain("hover:!text-[color:var(--tab-hover-fg");

    expect(container.querySelector("hr")).toBeNull();
  });
});
