import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileOrders from "@/pages/ProfileOrders";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  getMyBookings: vi.fn(),
  cancelBooking: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: mockApi,
  };
});

describe("Profile orders flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-abc",
        user: {
          id: 1,
          fullName: "Test User",
          phone: "+996700000001",
        },
      }),
    );
  });

  it("loads bookings and allows cancel", async () => {
    mockApi.getMyBookings.mockResolvedValue([
      {
        id: 101,
        service_id: 1,
        service_name: "Classic haircut",
        service_price: "700",
        barber_id: 1,
        barber_name: "Timur Karimov",
        salon_id: 1,
        salon_name: "HairLine Center",
        salon_address: "Chuy Ave, 150",
        date: "2099-12-31",
        time: "10:00:00",
        created_at: "2099-12-20T10:00:00.000Z",
      },
    ]);
    mockApi.cancelBooking.mockResolvedValue({ status: "cancelled" });

    renderWithProviders(
      <Routes>
        <Route path="/profile/orders" element={<ProfileOrders />} />
      </Routes>,
      { route: "/profile/orders" },
    );

    expect(await screen.findByText("Classic haircut")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(mockApi.cancelBooking).toHaveBeenCalledWith("token-abc", 101);
    });
  });
});
