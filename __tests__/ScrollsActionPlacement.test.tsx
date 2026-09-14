import { render, screen, within } from "@testing-library/react";

import SectionHeader from "@/components/layout/SectionHeader";

describe("Scrolls release action placement", () => {
  const previousFlag = process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED;

  afterEach(() => {
    jest.resetModules();
    if (previousFlag === undefined) {
      delete process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED = previousFlag;
    }
  });

  it("keeps creation with the section heading and search controls in the toolbar", () => {
    process.env.NEXT_PUBLIC_RELEASE_CREATION_ENABLED = "1";
    jest.resetModules();
    const {
      default: ActionBar,
      ReleaseCreationActions,
    } = require("@/app/mark2/shaolin-scrolls/_components/ActionBar");

    render(
      <>
        <SectionHeader
          title="Release Directory"
          actions={<ReleaseCreationActions q="ship it" />}
        />
        <ActionBar q="ship it" sort="semver:desc" total={2} />
      </>,
    );

    const headingHeader = screen
      .getByRole("heading", { name: "Release Directory" })
      .closest("header");
    expect(headingHeader).not.toBeNull();
    expect(
      within(headingHeader as HTMLElement).getByRole("button", {
        name: "Create Patch",
      }),
    ).toBeVisible();
    expect(
      within(headingHeader as HTMLElement).getByRole("button", {
        name: "Create Minor",
      }),
    ).toBeVisible();
    expect(headingHeader?.querySelector('input[name="label"]')).toHaveValue(
      "ship it",
    );

    const toolbar = screen.getByRole("group", {
      name: "Shaolin Scroll controls",
    });
    expect(
      within(toolbar).queryByRole("button", { name: "Create Patch" }),
    ).not.toBeInTheDocument();
    expect(
      within(toolbar).getByRole("link", { name: "Clear search" }),
    ).toBeVisible();
  });
});
