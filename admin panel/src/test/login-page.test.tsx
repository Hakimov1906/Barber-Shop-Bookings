import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth";
import { LoginPage } from "../pages/LoginPage";

vi.mock("../auth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("LoginPage", () => {
  it("keeps +996 prefix and validates phone format", async () => {
    const login = vi.fn();
    mockedUseAuth.mockReturnValue({
      token: null,
      admin: null,
      isAuthenticated: false,
      login,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admins" element={<div>admins</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const phoneInput = screen.getByLabelText("Телефон");
    fireEvent.change(phoneInput, { target: { value: "" } });
    expect((phoneInput as HTMLInputElement).value).toBe("+996");

    fireEvent.change(phoneInput, { target: { value: "+996123" } });
    await userEvent.type(screen.getByLabelText("Пароль"), "123456");

    const form = screen.getByRole("button", { name: "Войти" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(screen.getByText("Введите телефон в формате +996XXXXXXXXX")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
