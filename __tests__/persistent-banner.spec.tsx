import { act, fireEvent, render, screen } from "@testing-library/react";
import PersistentBannerHost from "@/components/PersistentBannerHost";
import {
  PERSISTENT_BANNER_STORAGE_KEY,
  clearPersistentBanner,
  setPersistentBanner,
} from "@/lib/persistent-banner";

describe("PersistentBannerHost", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  test("clearing via helper hides banner", async () => {
    render(<PersistentBannerHost />);

    act(() => {
      setPersistentBanner({ message: "Notice", variant: "info" });
    });

    expect(await screen.findByText(/Notice/)).toBeInTheDocument();

    act(() => {
      clearPersistentBanner();
    });

    expect(screen.queryByText(/Notice/)).toBeNull();
  });
});
