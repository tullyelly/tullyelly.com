import { readFileSync } from "node:fs";
import { join } from "node:path";
import code from "./fixtures/scroll-callouts.compiled.json";
import { render, screen } from "@testing-library/react";

// Jest cannot load this ESM-only adapter; mirror its compiled-code evaluator.
// The compiled MDX, shared map, MdxRenderer, and both Chronicle renderers are real.
jest.mock("next-contentlayer2/hooks", () => ({
  getMDXComponent: (code: string) =>
    new Function("_jsx_runtime", code)(jest.requireActual("react/jsx-runtime"))
      .default,
}));

jest.mock("@/components/mdx/ReleaseSection", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/SetCollector", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/YouTubeMusicPlaylist", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/ClanSnapshot", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/mdx/TcdbSnapshot", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/media/FolderImageCarousel.server", () => ({
  __esModule: true,
  default: () => null,
}));

import { ChronicleMdxRenderer } from "@/components/chronicles/ChronicleMdxRenderer";
import { ChronicleSectionMdxRenderer } from "@/components/chronicles/ChronicleSectionMdxRenderer";
import { MdxRenderer } from "@/components/mdx-renderer";
import { LuluLearns } from "@/components/scrolls/LuluLearns";
import { mdxComponents } from "@/mdx-components";

// Fixture compiled with @mdx-js/mdx (outputFormat: "function-body").
// Its source is retained beside the compiled code for review and regeneration.
const source = readFileSync(
  join(__dirname, "fixtures/scroll-callouts.mdx"),
  "utf8",
);

describe("callout MDX bindings", () => {
  it("registers Lulu without imports and renders rich MDX content", () => {
    expect(mdxComponents.LuluLearns).toBe(LuluLearns);
    render(<MdxRenderer code={code} />);
    const note = screen.getByText("lulu learns").parentElement!;
    expect(note).toHaveAttribute("data-lulu-learns");
    expect(note).toHaveAttribute("data-scroll-callout");
    expect(note).not.toHaveAttribute("data-scroll-amendment");
    expect(screen.getByText("lulu learns")).toHaveStyle({
      backgroundColor: "var(--lulu-plum)",
    });
    expect(note).toHaveClass("my-6");
    expect(note).toHaveClass("bg-[color:var(--lulu-surface)]");
    expect(screen.getByText("small discovery").closest("span")).toHaveClass(
      "!text-[color:var(--lulu-plum)]",
      "[&_*]:!text-[color:var(--lulu-plum)]",
      "[&_a:hover]:!text-white",
    );
    expect(screen.getByText("lulu learns")).toHaveClass(
      "text-[color:var(--white)]",
    );
    expect(screen.getByText("lulu learns")).toBeVisible();
    expect(screen.getByText("small discovery").tagName).toBe("STRONG");
    expect(screen.getByText("care").tagName).toBe("EM");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "lulu" })).toHaveAttribute(
      "data-person-tag",
      "lulu",
    );
    expect(note.className).toContain(
      "[&_a:focus-visible]:outline-[var(--lulu-plum)]",
    );
    expect(screen.getByText("lulu learns")).toHaveClass(
      "rounded-tl-lg",
      "rounded-tr-none",
    );
  });

  it.each([
    "2026-01-01",
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T06:00:00Z",
    "2026-10-02T05:00:00Z",
    "2026-07-01T00:00:00.000Z",
    "2026-03-08T00:00:00.000Z",
    "2026-11-01T00:00:00.000Z",
  ])(
    "preserves the frontmatter calendar day through full and section renderers: %s",
    (postDate) => {
      const full = render(
        <ChronicleMdxRenderer
          code={code}
          source={source}
          slug="sample"
          postDate={postDate}
        />,
      );
      expect(
        screen.getAllByText(`scroll amendment · ${postDate.slice(0, 10)}`),
      ).toHaveLength(2);
      expect(screen.getByText("scroll amendment · 2026-10-03")).toBeVisible();
      full.unmount();
      render(
        <ChronicleSectionMdxRenderer
          code={code}
          postDate={postDate}
          chronicleSlug="sample"
        />,
      );
      expect(
        screen.getAllByText(`scroll amendment · ${postDate.slice(0, 10)}`),
      ).toHaveLength(2);
      expect(screen.getByText("scroll amendment · 2026-10-03")).toBeVisible();
    },
  );

  it.each(["", "invalid", "2026-02-31"])(
    "renders no placeholder for unavailable inherited date %s",
    (postDate) => {
      render(<ChronicleSectionMdxRenderer code={code} postDate={postDate} />);
      expect(screen.getAllByText("scroll amendment")).toHaveLength(2);
      expect(screen.getByText("scroll amendment · 2026-10-03")).toBeVisible();
    },
  );

  it("leaves standalone amendments dateless and preserves explicit dates", () => {
    render(<MdxRenderer code={code} />);
    expect(screen.getAllByText("scroll amendment")).toHaveLength(2);
    expect(screen.getByText("scroll amendment · 2026-10-03")).toBeVisible();
  });
});
