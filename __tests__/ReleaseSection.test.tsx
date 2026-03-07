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
jest.mock("server-only", () => ({}));
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

  it("renders lcs details from the unified review prop", async () => {
    const ui = await ReleaseSection({
      ...baseProps,
      review: {
        type: "lcs",
        id: "noblesville-sports-cards",
        name: "Noblesville Sports Cards",
        url: "https://noblesvillesportscards.example.com",
        rating: "9.2/10",
      },
    });
    const { container } = render(ui);

    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          "Card Shop: Noblesville Sports Cards (9.2/10)",
      ),
    ).toBeInTheDocument();
    const shopLink = screen.getByText("Noblesville Sports Cards").closest("a");
    expect(shopLink).toBeInTheDocument();
    expect(shopLink).toHaveAttribute(
      "href",
      "https://noblesvillesportscards.example.com",
    );
    expect(screen.queryByText("Legacy Shop")).toBeNull();

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper.className).toContain("border-double");
    expect(wrapper.className).toContain("border-[var(--tcdb-wood-dark)]");

    const content = container.querySelector(
      "[data-review-name]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-review-type", "lcs");
    expect(content).toHaveAttribute(
      "data-review-id",
      "noblesville-sports-cards",
    );
    expect(content).toHaveAttribute(
      "data-review-name",
      "Noblesville Sports Cards",
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
      screen.getByText(
        (_, node) => node?.textContent === "Table Schema: Pizza Shack (9/10)",
      ),
    ).toBeInTheDocument();
    const tableSchemaLink = screen.getByText("Pizza Shack").closest("a");
    expect(tableSchemaLink).toBeInTheDocument();
    expect(tableSchemaLink).toHaveAttribute(
      "href",
      "https://pizzashack.example.com",
    );
    expect(tableSchemaLink).toHaveAttribute("target", "_blank");
    expect(tableSchemaLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(getScrollMock).not.toHaveBeenCalled();
    expect(container.querySelector("div.relative")).toBeNull();
    expect(container.querySelector(".tcdb-frame")).toBeNull();

    const wrapper = container.querySelector("div.rounded-lg") as HTMLDivElement;
    expect(wrapper.className).toContain("border-solid");
    expect(wrapper.className).toContain("border-[var(--table-schema-spice)]");

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
      screen.getByText(
        (_, node) => node?.textContent === "Save Point: Chrono Trigger (10/10)",
      ),
    ).toBeInTheDocument();
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

  it("applies rainbowColour to eligible non-release sections", async () => {
    const rainbowColour = "#00FF00";
    const ui = await ReleaseSection({
      ...baseProps,
      rainbowColour,
      review: {
        type: "lcs",
        id: "noblesville-sports-cards",
        name: "Noblesville Sports Cards",
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
    expect(tagPill.style.getPropertyValue("--tab-hover-fg")).toBe(rainbowColour);

    const divider = container.querySelector("hr") as HTMLHRElement;
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveStyle({ backgroundColor: toRgb(rainbowColour) });
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

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });
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
    const rainbowColour = "#00FF00";
    const ui = await ReleaseSection({
      ...baseProps,
      tcdbTradeId: "359632",
      tcdbTradePartner: "collect-a-set",
      rainbowColour,
    });
    const { container } = render(ui);

    expect(getScrollMock).not.toHaveBeenCalled();

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).not.toContain("tcdb-border");
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

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
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe("#FF0000");

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
    expect(content.style.getPropertyValue("--mdx-divider-color")).toBe("#FF0000");

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
    expect(tagPill.style.getPropertyValue("--tab-hover-fg")).toBe(rainbowColour);
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

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
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

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).not.toContain("chrome-foil-border");
    expect(wrapper).toHaveStyle({ borderColor: toRgb(rainbowColour) });

    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
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

    const wrapper = container.querySelector("div.relative") as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ borderColor: toRgb("#0077C0") });
    expect(wrapper.className).not.toContain("mb-10");

    const content = wrapper.querySelector(
      "[data-release-color]",
    ) as HTMLDivElement;
    expect(content).toHaveAttribute("data-release-color", "#0077C0");
    const tab = wrapper.querySelector(".absolute") as HTMLAnchorElement;
    expect(tab.style.getPropertyValue("--tab-bg")).toBe("#0077C0");
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-bg")).toBe("#FFFFFF");
    expect(tab.style.getPropertyValue("--tab-hover-fg")).toBe("#0077C0");
    expect(tab.className).toContain("!text-[color:var(--tab-fg");
    expect(tab.className).toContain("hover:!text-[color:var(--tab-hover-fg");

    expect(container.querySelector("hr")).toBeNull();
  });
});
