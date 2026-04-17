import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RequireAuth } from "../components/RequireAuth";
import { useAuth } from "../auth";

vi.mock("../auth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("RequireAuth", () => {
  it("redirects anonymous users to login", () => {
    mockedUseAuth.mockReturnValue({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admins"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/admins"
            element={
              <RequireAuth>
                <div>private page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders protected page for authenticated user", () => {
    mockedUseAuth.mockReturnValue({
      token: "token",
      admin: { id: 1, phone: "+996555555555", full_name: "Admin" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admins"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/admins"
            element={
              <RequireAuth>
                <div>private page</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("private page")).toBeInTheDocument();
  });
});
