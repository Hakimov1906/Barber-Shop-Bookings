import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

type CartProps = {
  isEmbedded?: boolean;
};

const Cart = ({ isEmbedded = false }: CartProps) => {
  const { tr, price } = useI18n();
  const { items, totalPrice, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, isLoading, setQuantity } = useCart();

  const emptyContent = (
    <div className="surface-card p-8 text-center sm:p-10">
      <h1 className="section-title">{tr("cart.page.title")}</h1>
      <p className="section-subtitle">{tr("cart.empty")}</p>
      <Link to="/shop">
        <Button className="mt-6" variant="default">
          {tr("cart.continue")}
        </Button>
      </Link>
    </div>
  );

  if (items.length === 0) {
    return isEmbedded ? (
      emptyContent
    ) : (
      <div className="page-shell page-section">{emptyContent}</div>
    );
  }

  const content = (
    <>
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="section-title">{tr("cart.page.title")}</h1>
            <p className="section-subtitle">{tr("cart.page.subtitle")}</p>
          </div>
          <Button variant="secondary" onClick={() => void clearCart()} disabled={isLoading}>
            {tr("cart.clear")}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="surface-card overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-24">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h2 className="text-base font-semibold sm:text-lg">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{price(item.price)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void decreaseQuantity(item.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = Math.max(1, Number(e.target.value));
                      setQuantity(item.id, newQuantity);
                    }}
                    disabled={isLoading}
                    className="w-20 bg-transparent text-center text-lg font-semibold focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: "textfield" }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void increaseQuantity(item.id)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void removeFromCart(item.id)}
                  disabled={isLoading}
                >
                  {tr("cart.remove")}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">{tr("cart.itemTotal")}</p>
              <p className="text-base font-semibold">{price(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{tr("cart.total")}</p>
            <p className="mt-1 text-3xl font-semibold">{price(totalPrice)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void clearCart()} disabled={isLoading}>
              {tr("cart.clear")}
            </Button>
            <Button>{tr("cart.checkout")}</Button>
          </div>
        </div>
      </div>
    </>
  );

  return isEmbedded ? content : <div className="page-shell page-section">{content}</div>;
};

export default Cart;
