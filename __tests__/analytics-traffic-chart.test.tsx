import { render, screen } from "@testing-library/react";
import { TrafficChart } from "@/components/analytics/TrafficChart";

test("verified counts above chart precision receive an honest explanation and exact-value guidance", () => {
  render(
    <TrafficChart
      rows={[
        { day: "2026-10-01", views: "9007199254740993" },
        { day: "2026-10-02", views: null },
        { day: "2026-10-03", views: "0" },
      ]}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Some verified counts exceed chart precision",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "See Daily values for their exact counts",
  );
  expect(screen.getByRole("img")).toHaveAccessibleName(
    /unverified days or counts exceeding chart precision/,
  );
});

test("ordinary verified zero and missing days retain the ordinary gap explanation", () => {
  render(
    <TrafficChart
      rows={[
        { day: "2026-10-01", views: "0" },
        { day: "2026-10-02", views: null },
      ]}
    />,
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("img")).toHaveAccessibleName(
    "Daily archived public page views; gaps represent unverified days",
  );
});

test("private chart labels whole-site scope while preserving exact-count guidance", () => {
  render(
    <TrafficChart
      scope="sitewide"
      rows={[{ day: "2026-10-01", views: "9007199254740993" }]}
    />,
  );
  expect(screen.getByRole("img")).toHaveAccessibleName(
    /Daily archived whole-site page views/,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "exceed chart precision",
  );
});
