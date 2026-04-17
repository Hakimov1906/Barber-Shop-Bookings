import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth";

describe("App /admins", () => {
  it("renders admins list for authenticated session", async () => {
    localStorage.setItem(
      "hairline-admin-auth",
      JSON.stringify({
        token: "token",
        admin: { id: 1, phone: "+996555555555", full_name: "Main Admin" },
      }),
    );

    window.history.pushState({}, "", "/admins");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 1,
              full_name: "Main Admin",
              phone: "+996555555555",
              created_at: "2026-04-16T10:00:00Z",
              updated_at: "2026-04-16T12:00:00Z",
            },
          ],
          limit: 50,
          offset: 0,
          total: 1,
          hasMore: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Администраторы" })).toBeInTheDocument();
    expect(await screen.findAllByText("Main Admin")).not.toHaveLength(0);
  });
});
