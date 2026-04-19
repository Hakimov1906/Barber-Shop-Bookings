import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type CartProduct = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

export type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addToCart: (product: CartProduct) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  increaseQuantity: (productId: string) => Promise<boolean>;
  decreaseQuantity: (productId: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function mapApiCartItemToCartItem(item: Awaited<ReturnType<typeof api.getMyCart>>["items"][number]): CartItem {
  return {
    id: String(item.product_id),
    name: item.name,
    price: Number(item.price),
    image: item.image_url || "",
    quantity: Number(item.quantity),
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const { tr } = useI18n();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const redirectToAuth = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    const redirect = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/auth?redirect=${encodeURIComponent(redirect)}`);
  }, []);

  const ensureToken = useCallback(() => {
    if (token) return token;
    toast({
      variant: "destructive",
      title: tr("booking.signin.required.title"),
      description: tr("booking.signin.required.desc"),
    });
    redirectToAuth();
    return null;
  }, [redirectToAuth, token, tr]);

  const loadCart = useCallback(
    async (authToken: string) => {
      const response = await api.getMyCart(authToken);
      setItems(response.items.map(mapApiCartItemToCartItem));
    },
    [],
  );

  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    loadCart(token)
      .catch((error) => {
        const description =
          error instanceof ApiError ? error.message : tr("cart.error.load");
        toast({
          variant: "destructive",
          title: tr("booking.error.title"),
          description,
        });
      })
      .finally(() => setIsLoading(false));
  }, [loadCart, token, tr]);

  const withAuthCartUpdate = useCallback(
    async (updater: (authToken: string) => Promise<void>) => {
      const authToken = ensureToken();
      if (!authToken) return false;

      try {
        setIsLoading(true);
        await updater(authToken);
        await loadCart(authToken);
        return true;
      } catch (error) {
        const description =
          error instanceof ApiError ? error.message : tr("cart.error.update");
        toast({
          variant: "destructive",
          title: tr("booking.error.title"),
          description,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureToken, loadCart, tr],
  );

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      totalItems,
      totalPrice,
      isLoading,
      addToCart: async (product) => {
        const productId = Number(product.id);
        const existing = items.find((item) => item.id === String(productId));
        const nextQuantity =
          (existing?.quantity || 0) + (product.quantity && product.quantity > 0 ? product.quantity : 1);

        return withAuthCartUpdate(async (authToken) => {
          await api.setMyCartItem(authToken, productId, { quantity: nextQuantity });
        });
      },
      removeFromCart: async (productId) =>
        withAuthCartUpdate(async (authToken) => {
          await api.removeMyCartItem(authToken, Number(productId));
        }),
      increaseQuantity: async (productId) => {
        const existing = items.find((item) => item.id === productId);
        if (!existing) return false;
        return withAuthCartUpdate(async (authToken) => {
          await api.setMyCartItem(authToken, Number(productId), {
            quantity: existing.quantity + 1,
          });
        });
      },
      decreaseQuantity: async (productId) => {
        const existing = items.find((item) => item.id === productId);
        if (!existing) return false;
        return withAuthCartUpdate(async (authToken) => {
          if (existing.quantity <= 1) {
            await api.removeMyCartItem(authToken, Number(productId));
            return;
          }

          await api.setMyCartItem(authToken, Number(productId), {
            quantity: existing.quantity - 1,
          });
        });
      },
      setQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          return withAuthCartUpdate(async (authToken) => {
            await api.removeMyCartItem(authToken, Number(productId));
          });
        }

        return withAuthCartUpdate(async (authToken) => {
          await api.setMyCartItem(authToken, Number(productId), { quantity });
        });
      },
      clearCart: async () =>
        withAuthCartUpdate(async (authToken) => {
          await api.clearMyCart(authToken);
        }),
    };
  }, [isLoading, items, withAuthCartUpdate]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
