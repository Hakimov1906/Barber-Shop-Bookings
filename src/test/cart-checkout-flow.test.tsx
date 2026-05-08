import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockCart = vi.hoisted(() => ({
  items: [
    {
      id: "1",
      name: "Matte Clay",
      price: 500,
      image: "/product.jpg",
      quantity: 2,
    },
  ],
  totalItems: 2,
  totalPrice: 1000,
  isLoading: false,
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  increaseQuantity: vi.fn(),
  decreaseQuantity: vi.fn(),
  setQuantity: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("@/lib/cart", () => ({
  useCart: () => mockCart,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe("Cart checkout flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockCart.clearCart.mockResolvedValue(true);
  });

  it("opens checkout from the cart checkout button", async () => {
    renderWithProviders(
      <>
        <LocationProbe />
        <Routes>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </>,
      { route: "/cart" },
    );

    fireEvent.click(screen.getByRole("link", { name: "Checkout" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/checkout");
    });
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Place order" })).toBeInTheDocument();
  });
});
