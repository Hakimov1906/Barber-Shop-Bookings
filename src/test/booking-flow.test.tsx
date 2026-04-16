import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingDialog from "@/components/BookingDialog";
import type { Master } from "@/data/masters";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  getServices: vi.fn(),
  getSlots: vi.fn(),
  createBooking: vi.fn(),
}));
const toastSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: mockApi,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  toast: toastSpy,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect?.(new Date(2099, 11, 31))}>
      Select mocked date
    </button>
  ),
}));

const master: Master = {
  id: "1",
  name: "Timur Karimov",
  role: "Barber",
  experience: "8 years",
  rating: 4.8,
  reviews: 120,
  specialties: ["Fade"],
  available: true,
  salonId: "1",
  salonCode: "center",
  salonName: "HairLine Center",
  salonAddress: "Chuy Ave, 150",
  image: "/master.jpg",
  portfolio: [],
  clientReviews: [],
  bio: "Experienced barber",
};

describe("Booking flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-booking",
        user: {
          id: 1,
          fullName: "Booking User",
          phone: "+996700000001",
        },
      }),
    );
    localStorage.setItem("hairline-lang", "en");
  });

  it("creates booking for selected service/date/time", async () => {
    mockApi.getServices.mockResolvedValue([
      {
        id: 1,
        name: "Classic haircut",
        duration_minutes: 30,
        price: "700",
      },
    ]);
    mockApi.getSlots.mockResolvedValue([
      {
        id: 11,
        barber_id: 1,
        date: "2099-12-31",
        time: "10:00",
        status: "available",
      },
    ]);
    mockApi.createBooking.mockResolvedValue({
      id: 999,
      createdAt: "2099-12-01T10:00:00.000Z",
    });

    renderWithProviders(<BookingDialog master={master} open onOpenChange={() => {}} />, {
      route: "/masters/1",
    });

    fireEvent.click(await screen.findByRole("button", { name: /Classic haircut/i }));
    await screen.findByText("Select a date");
    fireEvent.click(screen.getByRole("button", { name: "Select mocked date" }));
    fireEvent.click(await screen.findByRole("button", { name: /10:00/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockApi.createBooking).toHaveBeenCalledWith("token-booking", {
        serviceId: 1,
        barberId: 1,
        date: "2099-12-31",
        time: "10:00",
      });
    });
  });

  it("shows localized error when active booking limit is reached", async () => {
    mockApi.getServices.mockResolvedValue([
      {
        id: 1,
        name: "Classic haircut",
        duration_minutes: 30,
        price: "700",
      },
    ]);
    mockApi.getSlots.mockResolvedValue([
      {
        id: 11,
        barber_id: 1,
        date: "2099-12-31",
        time: "10:00",
        status: "available",
      },
    ]);
    mockApi.createBooking.mockRejectedValue(
      new ApiError("Maximum 2 active bookings per user reached", 409),
    );

    renderWithProviders(<BookingDialog master={master} open onOpenChange={() => {}} />, {
      route: "/masters/1",
    });

    fireEvent.click(await screen.findByRole("button", { name: /Classic haircut/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Select mocked date" }));
    fireEvent.click(await screen.findByRole("button", { name: /10:00/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Booking failed",
          description:
            "You already have 2 active bookings. Cancel one to create a new booking.",
        }),
      );
    });
  });
});
