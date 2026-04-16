import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Auth from "@/pages/Auth";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: mockApi,
  };
});

describe("Auth flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("signs in and navigates to profile", async () => {
    mockApi.login.mockResolvedValue({
      token: "token-123",
      user: {
        id: 7,
        fullName: "John Doe",
        phone: "+996700000001",
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<div>Profile page</div>} />
      </Routes>,
      { route: "/auth" },
    );

    fireEvent.change(screen.getByPlaceholderText("+996000000000"), {
      target: { value: "+996700000001" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockApi.login).toHaveBeenCalledWith({
        phone: "+996700000001",
        password: "secret123",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Profile page")).toBeInTheDocument();
    });
  });

  it("stays on auth page when login fails", async () => {
    mockApi.login.mockRejectedValue(new ApiError("Invalid credentials", 401));

    renderWithProviders(
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<div>Profile page</div>} />
      </Routes>,
      { route: "/auth" },
    );

    fireEvent.change(screen.getByPlaceholderText("+996000000000"), {
      target: { value: "+996700000001" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockApi.login).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});
