import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SnapshotButton from "@/components/categories/SnapshotButton";
import { saveCategorySnapshot } from "@/lib/client/categorySnapshots";
const mockRefresh = jest.fn();
const mockActivity = {
  start: jest.fn(() => "activity"),
  done: jest.fn(),
  error: jest.fn(),
};
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));
jest.mock("@/lib/client/categorySnapshots", () => ({
  ...jest.requireActual("@/lib/client/categorySnapshots"),
  saveCategorySnapshot: jest.fn(),
}));
jest.mock("@/components/activity/activity-provider", () => ({
  useActivity: () => mockActivity,
}));
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
const save = jest.mocked(saveCategorySnapshot);
const props = {
  categories: [{ slug: "basketball", name: "Basketball" }],
  defaultDate: "2026-10-25",
  category: "basketball",
};
// The shared Jest undici shim replaces these with undefined on this Node version.
// Restore constructors only in this form fixture; do not alter global DB/test guards.
const originalBlob = Object.getOwnPropertyDescriptor(globalThis, "Blob");
const originalFile = Object.getOwnPropertyDescriptor(globalThis, "File");
beforeAll(() => {
  Object.defineProperty(globalThis, "Blob", {
    configurable: true,
    writable: true,
    value: NodeBlob,
  });
  Object.defineProperty(globalThis, "File", {
    configurable: true,
    writable: true,
    value: NodeFile,
  });
});
afterAll(() => {
  if (originalBlob) Object.defineProperty(globalThis, "Blob", originalBlob);
  if (originalFile) Object.defineProperty(globalThis, "File", originalFile);
});
beforeEach(() => {
  jest.clearAllMocks();
  save.mockReset();
});
it("submits zero, prevents concurrent saves, closes and refreshes", async () => {
  let resolve!: (
    value: Awaited<ReturnType<typeof saveCategorySnapshot>>,
  ) => void;
  save.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<SnapshotButton {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Add Snapshot" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Add Snapshot");
  fireEvent.change(screen.getByLabelText("Owned-card count"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      category: "basketball",
      measured_on: "2026-10-25",
      card_count: 0,
      ranking: null,
      difference: null,
    }),
  );
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(save).toHaveBeenCalledTimes(1);
  resolve({ id: "1", status: "ok", freshness: "fresh" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});
it("preserves input and shows duplicate guidance after failure", async () => {
  save.mockRejectedValue({ error: "SNAPSHOT_ALREADY_EXISTS" });
  render(<SnapshotButton {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Add Snapshot" }));
  fireEvent.change(screen.getByLabelText("Owned-card count"), {
    target: { value: "125" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "choose Correct snapshot",
  );
  expect(screen.getByLabelText("Owned-card count")).toHaveValue(125);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(mockRefresh).not.toHaveBeenCalled();
});
it("corrects only the count, including pending-freshness success", async () => {
  save.mockResolvedValue({ id: "42", status: "ok", freshness: "pending" });
  render(
    <SnapshotButton
      {...props}
      snapshot={{
        snapshot_id: "42",
        measured_on: "2026-10-10",
        card_count: 12050,
      }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Correct snapshot for 2026-10-10" }),
  );
  expect(screen.getByLabelText("Measurement date")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("Category")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Owned-card count"), {
    target: { value: "12060" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      snapshot_id: "42",
      card_count: 12060,
      ranking: null,
      difference: null,
    }),
  );
  expect(mockActivity.done).toHaveBeenCalledWith("activity", {
    detail: expect.stringContaining("do not submit again"),
  });
});
it("rejects blank count and future date before sending", async () => {
  render(<SnapshotButton {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Add Snapshot" }));
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  expect(
    await screen.findByText("Enter a nonnegative whole number"),
  ).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});

it("prefills and corrects an optional ranking without changing category/date", async () => {
  save.mockResolvedValue({ id: "42", status: "ok", freshness: "fresh" });
  render(
    <SnapshotButton
      {...props}
      snapshot={{
        snapshot_id: "42",
        measured_on: "2026-10-10",
        card_count: 12050,
        ranking: 1500,
      }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Correct snapshot for 2026-10-10" }),
  );
  expect(screen.getByLabelText("TCDb ranking (optional)")).toHaveValue(1500);
  fireEvent.change(screen.getByLabelText("TCDb ranking (optional)"), {
    target: { value: "1450" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      snapshot_id: "42",
      card_count: 12050,
      ranking: 1450,
      difference: null,
    }),
  );
});
it("clears a ranking explicitly when the form is left blank", async () => {
  save.mockResolvedValue({ id: "42", status: "ok", freshness: "fresh" });
  render(
    <SnapshotButton
      {...props}
      snapshot={{
        snapshot_id: "42",
        measured_on: "2026-10-10",
        card_count: 12050,
        ranking: 1500,
      }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Correct snapshot for 2026-10-10" }),
  );
  fireEvent.change(screen.getByLabelText("TCDb ranking (optional)"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      snapshot_id: "42",
      card_count: 12050,
      ranking: null,
      difference: null,
    }),
  );
});

it.each(["0", "-75", ""])(
  'prefills difference and submits signed/cleared value "%s"',
  async (difference) => {
    save.mockResolvedValue({ id: "42", status: "ok", freshness: "fresh" });
    render(
      <SnapshotButton
        {...props}
        snapshot={{
          snapshot_id: "42",
          measured_on: "2026-10-10",
          card_count: 12050,
          ranking: 1400,
          difference: -100,
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Correct snapshot for 2026-10-10" }),
    );
    expect(screen.getByLabelText("Difference (optional)")).toHaveValue(-100);
    fireEvent.change(screen.getByLabelText("Difference (optional)"), {
      target: { value: difference },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save snapshot" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        snapshot_id: "42",
        card_count: 12050,
        ranking: 1400,
        difference: difference === "" ? null : Number(difference),
      }),
    );
  },
);
