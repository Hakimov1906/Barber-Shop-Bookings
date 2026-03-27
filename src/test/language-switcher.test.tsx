import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("Language switcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("switches active language and persists it", async () => {
    renderWithProviders(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: "Change language" }));
    fireEvent.click(screen.getByRole("button", { name: "RU" }));

    expect(localStorage.getItem("hairline-lang")).toBe("ru");
    expect(screen.getByRole("button", { name: /Сменить язык/i })).toHaveTextContent("RU");
  });
});
