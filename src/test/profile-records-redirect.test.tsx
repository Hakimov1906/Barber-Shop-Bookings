import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

const mockGetMyBookings = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      getMyBookings: mockGetMyBookings,
    },
  };
});

describe("Profile records redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyBookings.mockResolvedValue([]);
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-records",
        user: {
          id: 1,
          fullName: "Test User",
          phone: "+996700000001",
        },
      }),
    );
    window.history.replaceState({}, "", "/profile/records");
  });

  it("redirects /profile/records to /profile/orders", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My bookings" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/profile/orders");
  });
});
