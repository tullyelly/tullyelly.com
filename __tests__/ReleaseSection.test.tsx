import { render, screen } from "@testing-library/react";
import ReleaseSection from "@/components/mdx/ReleaseSection";
import { mdxComponents } from "@/mdx-components";

const getScrollMock = jest.fn();

jest.mock("@/components/Tweet", () => ({
  XEmbed: () => null,
}));
jest.mock("@/lib/scrolls", () => ({
  getScroll: (...args: unknown[]) => getScrollMock(...args),
}));

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
    expect(tab.style.getPropertyValue("--tab-fg")).toBe("#FFFFFF");
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

  it("colors nested dividers to match the release border when releaseId is present", async () => {
    const Divider = mdxComponents.hr;
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
    const List = mdxComponents.ul;
    const ListItem = mdxComponents.li;
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
