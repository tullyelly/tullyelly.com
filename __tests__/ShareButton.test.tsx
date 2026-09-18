import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ShareButton from "@/components/share/ShareButton";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/use-toast";
import { setAnalyticsRecorder } from "@/lib/analytics";

function renderShareButton() {
  return render(
    <ToastProvider>
      <ShareButton title="A Chronicle" description="A useful summary" />
      <Toaster />
    </ToastProvider>,
  );
}

function setNavigatorProperty(key: "share" | "clipboard", value: unknown) {
  Object.defineProperty(navigator, key, {
    configurable: true,
    value,
  });
}

describe("ShareButton", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    document.head.innerHTML = "";
    setAnalyticsRecorder(null);
  });

  afterEach(() => {
    setNavigatorProperty("share", originalShare);
    setNavigatorProperty("clipboard", originalClipboard);
    setAnalyticsRecorder(null);
  });

  it("uses native sharing with the title, summary, and canonical URL", async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    const record = jest.fn();
    setNavigatorProperty("share", share);
    setAnalyticsRecorder(record);
    document.head.innerHTML =
      '<link rel="canonical" href="https://tullyelly.com/shaolin/example">';

    renderShareButton();
    const button = screen.getByRole("button", { name: "Share this page" });
    expect(button).toHaveClass("bg-[var(--blue)]", "text-white");
    fireEvent.click(button);

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "A Chronicle",
        text: "A useful summary",
        url: "https://tullyelly.com/shaolin/example",
      }),
    );
    expect(record).toHaveBeenCalledWith({ name: "share.native", props: {} });
  });

  it("copies the current URL and shows temporary copied feedback", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setNavigatorProperty("share", undefined);
    setNavigatorProperty("clipboard", { writeText });

    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(location.href));
    expect(
      await screen.findByRole("button", { name: "Link copied" }),
    ).toHaveTextContent("Copied");
    expect(screen.getByText("Link copied")).toBeVisible();
  });

  it("treats cancellation as a normal outcome", async () => {
    const writeText = jest.fn();
    setNavigatorProperty(
      "share",
      jest.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
    );
    setNavigatorProperty("clipboard", { writeText });

    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));

    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(writeText).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Could not share this page"),
    ).not.toBeInTheDocument();
  });

  it("falls back to copying when native sharing fails", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setNavigatorProperty(
      "share",
      jest.fn().mockRejectedValue(new Error("Nope")),
    );
    setNavigatorProperty("clipboard", { writeText });

    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(location.href));
    expect(screen.getByRole("button", { name: "Link copied" })).toBeVisible();
  });

  it("reports a graceful error when neither sharing nor copying succeeds", async () => {
    setNavigatorProperty("share", undefined);
    setNavigatorProperty("clipboard", {
      writeText: jest.fn().mockRejectedValue(new Error("Denied")),
    });

    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));

    expect(await screen.findByText("Could not share this page")).toBeVisible();
    expect(
      screen.getByText("Copy the address from your browser and try again."),
    ).toBeVisible();
  });
});
