import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ProfileInfo from "@/pages/ProfileInfo";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("Profile info page", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-profile-info",
        user: {
          id: 1,
          fullName: "Test User",
          email: "test@example.com",
          phone: "+996700000001",
        },
      }),
    );
  });

  it("does not show quick action links and still shows account fields", () => {
    renderWithProviders(<ProfileInfo />, { route: "/profile" });

    expect(screen.queryByRole("link", { name: "My bookings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Profile settings" })).not.toBeInTheDocument();

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("+996700000001")).toBeInTheDocument();
  });
});
