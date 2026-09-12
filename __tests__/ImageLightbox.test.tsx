import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import ImageLightboxTrigger from "@/components/media/ImageLightboxTrigger";
import InteractiveImage from "@/components/media/InteractiveImage";
import FolderImageCarousel from "@/components/media/FolderImageCarousel";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    fill: _fill,
    priority: _priority,
    ...props
  }: ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const slides = [
  {
    src: "/images/optimus/test/portrait.webp",
    alt: "Portrait card front",
    width: 800,
    height: 1200,
  },
  {
    src: "/images/optimus/test/landscape.webp",
    alt: "Landscape card back",
    width: 1600,
    height: 900,
  },
  {
    src: "/images/optimus/test/square.webp",
    alt: "Square album cover",
    width: 1200,
    height: 1200,
  },
];

beforeEach(() => {
  // jsdom has no layout engine; give the real viewer a measurable viewport.
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(960);
  jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(640);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function openViewer(name = "Open test images") {
  const trigger = screen.getByRole("button", { name });
  act(() => trigger.focus());
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Image viewer" });
  await within(dialog).findByRole("region", { name: "Photo gallery" });
  return { trigger, dialog };
}

describe("ImageLightbox", () => {
  it("opens a named Radix dialog, keeps focus inside, and restores the trigger on Escape", async () => {
    render(
      <>
        <button type="button">Outside action</button>
        <ImageLightboxTrigger slides={slides}>
          <button type="button">Open test images</button>
        </ImageLightboxTrigger>
      </>,
    );

    const outside = screen.getByRole("button", { name: "Outside action" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const { trigger, dialog } = await openViewer();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
      "1 / 3",
    );
    expect(
      within(dialog).getByRole("img", { name: slides[0].alt }),
    ).toHaveAttribute("src", slides[0].src);
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement),
    );

    act(() => outside.focus());
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document.activeElement ?? dialog, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("opens at the requested slide and updates the counter when navigating", async () => {
    render(
      <ImageLightboxTrigger slides={slides} initialIndex={1}>
        <button type="button">Open test images</button>
      </ImageLightboxTrigger>,
    );

    const { dialog } = await openViewer();
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
      "2 / 3",
    );
    expect(
      within(dialog).getByRole("img", { name: slides[1].alt }),
    ).toHaveAttribute("src", slides[1].src);

    fireEvent.click(within(dialog).getByRole("button", { name: /^Next$/ }));
    await waitFor(() =>
      expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
        "3 / 3",
      ),
    );
    expect(
      within(dialog).getByRole("img", { name: slides[2].alt }),
    ).toHaveAttribute("src", slides[2].src);
    expect(
      within(dialog).getByRole("button", { name: /^Next$/ }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: /^Previous$/ }),
    ).toBeEnabled();
  });

  it("uses the viewer's keyboard navigation and closes through its close button", async () => {
    render(
      <ImageLightboxTrigger slides={slides} initialIndex={1}>
        <button type="button">Open test images</button>
      </ImageLightboxTrigger>,
    );

    const { trigger, dialog } = await openViewer();
    const next = within(dialog).getByRole("button", {
      name: /^Next$/,
    });
    act(() => next.focus());
    fireEvent.keyDown(next, { key: "ArrowLeft", code: "ArrowLeft" });
    await waitFor(() =>
      expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
        "1 / 3",
      ),
    );
    expect(
      within(dialog).getByRole("button", { name: /^Previous$/ }),
    ).toBeDisabled();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close image viewer" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("shows a single image without previous or next controls", async () => {
    render(
      <ImageLightboxTrigger slides={[slides[0]]}>
        <button type="button">Open test images</button>
      </ImageLightboxTrigger>,
    );

    const { dialog } = await openViewer();
    expect(
      screen.queryByTestId("image-lightbox-counter"),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /^Next$/ }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /^Previous$/ }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Zoom in$/ }),
    ).toBeInTheDocument();
  });
});

describe("image entry points", () => {
  it("opens the standalone image with its original source and alternative text", async () => {
    render(
      <InteractiveImage slide={slides[1]}>
        <span data-testid="server-image">Server-rendered image</span>
      </InteractiveImage>,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toContainElement(screen.getByTestId("server-image"));
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Image viewer" });
    expect(
      await within(dialog).findByRole("img", { name: slides[1].alt }),
    ).toHaveAttribute("src", slides[1].src);
    expect(
      screen.queryByTestId("image-lightbox-counter"),
    ).not.toBeInTheDocument();
  });

  it("opens the folder's ordered slides and resets to the first slide when reopened", async () => {
    render(<FolderImageCarousel slides={slides} />);

    const thumbnail = screen.getByTestId("folder-carousel-thumbnail");
    expect(
      within(thumbnail).getByRole("img", { name: slides[0].alt }),
    ).toHaveAttribute("src", slides[0].src);
    const { dialog } = await openViewer("Open image carousel");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Next$/ }));
    await waitFor(() =>
      expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
        "2 / 3",
      ),
    );
    expect(
      within(dialog).getByRole("img", { name: slides[1].alt }),
    ).toHaveAttribute("src", slides[1].src);

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close image viewer" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(thumbnail).toHaveFocus();
    await openViewer("Open image carousel");
    expect(screen.getByTestId("image-lightbox-counter")).toHaveTextContent(
      "1 / 3",
    );
  });

  it("renders no folder trigger for an empty folder", () => {
    const { container } = render(<FolderImageCarousel slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
