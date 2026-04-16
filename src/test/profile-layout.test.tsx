import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Profile from "@/pages/Profile";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("Profile navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "hairline-auth",
      JSON.stringify({
        token: "token-profile",
        user: {
          id: 1,
          fullName: "Test User",
          phone: "+996700000001",
        },
      }),
    );
  });

  it("shows only info, bookings, settings tabs and keeps red logout button", () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<Profile />}>
          <Route index element={<div>Info content</div>} />
          <Route path="orders" element={<div>Orders content</div>} />
          <Route path="settings" element={<div>Settings content</div>} />
        </Route>
      </Routes>,
      { route: "/profile" },
    );

    expect(screen.getByRole("link", { name: "Information" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bookings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Records" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cart" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Shop" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
