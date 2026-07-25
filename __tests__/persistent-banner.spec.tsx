import { act, fireEvent, render, screen } from "@testing-library/react";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import {
  PERSISTENT_BANNER_STORAGE_KEY,
  clearPersistentBanner,
  getPersistentBanner,
  getPersistentBanners,
  setPersistentBanner,
} from "@/lib/persistent-banner";

describe("PersistentBannerHost", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("returns null when nothing stored", () => {
    expect(getPersistentBanner()).toBeNull();
  });

  test("renders banner when persistent payload exists", async () => {
    render(<PersistentBannerHost />);

    act(() => {
      setPersistentBanner({ message: "Access revoked", variant: "warning" });
    });

    expect(await screen.findByText(/Access revoked/)).toBeInTheDocument();
  });

  test("dismiss clears stored banner", async () => {
    render(<PersistentBannerHost />);

    act(() => {
      setPersistentBanner({ message: "Important notice", variant: "warning" });
    });

    const dismiss = await screen.findByLabelText(/dismiss announcement/i);
    fireEvent.click(dismiss);

    expect(
      window.localStorage.getItem(PERSISTENT_BANNER_STORAGE_KEY),
    ).toBeNull();
    expect(screen.queryByText(/Important notice/)).toBeNull();
  });

  test("queues multiple banners and dismisses them independently", async () => {
    render(<PersistentBannerHost />);

    act(() => {
      setPersistentBanner({
        message: "Giannis was saved.",
        variant: "success",
      });
      setPersistentBanner({
        message: "Glenn failed to save.",
        variant: "error",
      });
    });

    expect(await screen.findByText("Giannis was saved.")).toBeInTheDocument();
    expect(screen.getByText("Glenn failed to save.")).toBeInTheDocument();
    expect(getPersistentBanners()).toHaveLength(2);

    const dismissButtons = screen.getAllByLabelText(/dismiss announcement/i);
    fireEvent.click(dismissButtons[0]!);

    expect(screen.queryByText("Giannis was saved.")).not.toBeInTheDocument();
    expect(screen.getByText("Glenn failed to save.")).toBeInTheDocument();
    expect(getPersistentBanners()).toHaveLength(1);
  });

  test("clearing via helper hides banner", async () => {
    render(<PersistentBannerHost />);

    act(() => {
      setPersistentBanner({ message: "Notice", variant: "info" });
    });

    expect(await screen.findAllByText("Notice")).toHaveLength(2);

    act(() => {
      clearPersistentBanner();
    });

    expect(screen.queryAllByText("Notice")).toHaveLength(0);
  });
});

describe("persistent banner helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("handles localStorage failures gracefully", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("boom");
      });
    expect(() => setPersistentBanner({ message: "hey" })).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to persist banner",
      expect.any(Error),
    );

    const removeItemSpy = jest
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("oh no");
      });
    expect(() => clearPersistentBanner()).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to clear banner",
      expect.any(Error),
    );

    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();

    errorSpy.mockRestore();
  });

  test("returns null when stored payload is invalid", () => {
    window.localStorage.setItem(PERSISTENT_BANNER_STORAGE_KEY, "{not json}");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(getPersistentBanner()).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to parse persisted banner",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  test("returns parsed payload when valid", () => {
    setPersistentBanner({ message: "Hi", variant: "info" });
    const payload = getPersistentBanner();
    expect(payload).toMatchObject({ message: "Hi", variant: "info" });
  });

  test("ignores payloads missing message", () => {
    window.localStorage.setItem(
      PERSISTENT_BANNER_STORAGE_KEY,
      JSON.stringify({ variant: "warning" }),
    );
    expect(getPersistentBanner()).toBeNull();
  });

  test("falls back gracefully when window is undefined", () => {
    const originalWindow = global.window;
    // @ts-expect-error allow temporarily removing window
    delete global.window;
    jest.resetModules();
    const bannerModule = require("@/lib/persistent-banner");
    expect(() =>
      bannerModule.setPersistentBanner({ message: "Offline" }),
    ).not.toThrow();
    expect(() => bannerModule.clearPersistentBanner()).not.toThrow();
    expect(bannerModule.getPersistentBanner()).toBeNull();
    global.window = originalWindow;
    jest.resetModules();
  });
});
