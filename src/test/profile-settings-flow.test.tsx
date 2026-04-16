import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileSettings from "@/pages/ProfileSettings";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockApi = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: mockApi,
  };
});

describe("Profile settings flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-xyz",
        user: {
          id: 1,
          fullName: "Test User",
          phone: "+996700000001",
        },
      }),
    );
  });

  it("submits changed profile fields", async () => {
    mockApi.updateProfile.mockResolvedValue({
      user: {
        id: 1,
        full_name: "Updated User",
        phone: "+996700000001",
        created_at: "2099-01-01T00:00:00.000Z",
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/profile/settings" element={<ProfileSettings />} />
      </Routes>,
      { route: "/profile/settings" },
    );

    const fullNameInput = screen.getByLabelText("Full name");
    fireEvent.change(fullNameInput, { target: { value: "Updated User" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockApi.updateProfile).toHaveBeenCalledWith("token-xyz", {
        fullName: "Updated User",
      });
    });
  });

  it("blocks submit on password mismatch and submits valid password change", async () => {
    mockApi.updatePassword.mockResolvedValue({ status: "password_updated" });

    renderWithProviders(
      <Routes>
        <Route path="/profile/settings" element={<ProfileSettings />} />
      </Routes>,
      { route: "/profile/settings" },
    );

    const currentPasswordInput = screen.getByLabelText("Current password");
    const newPasswordInput = screen.getByLabelText("New password");
    const repeatPasswordInput = screen.getByLabelText("Repeat new password");
    const changePasswordButton = screen.getByRole("button", { name: "Change password" });

    fireEvent.change(currentPasswordInput, { target: { value: "old-password" } });
    fireEvent.change(newPasswordInput, { target: { value: "new-password" } });
    fireEvent.change(repeatPasswordInput, { target: { value: "other-password" } });

    expect(changePasswordButton).toBeDisabled();

    fireEvent.change(repeatPasswordInput, { target: { value: "new-password" } });

    await waitFor(() => {
      expect(changePasswordButton).not.toBeDisabled();
    });

    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(mockApi.updatePassword).toHaveBeenCalledWith("token-xyz", {
        currentPassword: "old-password",
        newPassword: "new-password",
      });
    });

    await waitFor(() => {
      expect(currentPasswordInput).toHaveValue("");
      expect(newPasswordInput).toHaveValue("");
      expect(repeatPasswordInput).toHaveValue("");
    });
  });
});
