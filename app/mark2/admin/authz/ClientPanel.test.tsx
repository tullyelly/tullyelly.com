import { render, screen, within } from "@testing-library/react";

import AdminAuthzPanel from "./ClientPanel";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), replace: jest.fn() }),
}));

jest.mock("./actions", () => ({
  grantRole: jest.fn(),
  revokeRole: jest.fn(),
}));

const memberships = [
  {
    user_id: "user-b",
    email: "zeta@example.com",
    app_slug: null,
    role: "viewer",
    granted_at: "2026-09-12T15:00:00.000Z",
  },
  {
    user_id: "user-a",
    email: "alpha@example.com",
    app_slug: "cardattack",
    role: "admin",
    granted_at: "2026-09-13T15:00:00.000Z",
  },
];

describe("AdminAuthzPanel", () => {
  it("renders memberships through the shared mobile and desktop data views", () => {
    render(<AdminAuthzPanel initialMemberships={memberships} />);

    const table = screen.getByRole("table", {
      name: "Authorization memberships",
    });
    expect(
      within(table).getByRole("columnheader", { name: "User ID" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent(
      "alpha@example.com",
    );
    expect(screen.getAllByText("cardattack")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Revoke" })).toHaveLength(4);
  });

  it("uses the shared empty states on mobile and desktop", () => {
    render(<AdminAuthzPanel initialMemberships={[]} />);

    expect(screen.getAllByText("No memberships recorded.")).toHaveLength(2);
  });
});
