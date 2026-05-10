import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n, type Lang } from "@/lib/i18n";

const copy: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    contact: string;
    delivery: string;
    address: string;
    comment: string;
    summary: string;
    empty: string;
    submit: string;
    successTitle: string;
    successDesc: string;
  }
> = {
  en: {
    title: "Checkout",
    subtitle: "Confirm your contact details and delivery information.",
    contact: "Contact details",
    delivery: "Delivery details",
    address: "Delivery address",
    comment: "Comment",
    summary: "Order summary",
    empty: "Your cart is empty. Add products before checkout.",
    submit: "Place order",
    successTitle: "Order placed",
    successDesc: "We will contact you to confirm the details.",
  },
  ru: {
    title: "\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u043a\u0430\u0437\u0430",
    subtitle:
      "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438.",
    contact: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435",
    delivery: "\u0414\u0430\u043d\u043d\u044b\u0435 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438",
    address: "\u0410\u0434\u0440\u0435\u0441 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438",
    comment: "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439",
    summary: "\u0421\u043e\u0441\u0442\u0430\u0432 \u0437\u0430\u043a\u0430\u0437\u0430",
    empty:
      "\u041a\u043e\u0440\u0437\u0438\u043d\u0430 \u043f\u0443\u0441\u0442\u0430. \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0442\u043e\u0432\u0430\u0440\u044b \u043f\u0435\u0440\u0435\u0434 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435\u043c.",
    submit: "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0437\u0430\u043a\u0430\u0437",
    successTitle: "\u0417\u0430\u043a\u0430\u0437 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d",
    successDesc:
      "\u041c\u044b \u0441\u0432\u044f\u0436\u0435\u043c\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u0434\u043b\u044f \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u0438\u044f \u0434\u0435\u0442\u0430\u043b\u0435\u0439.",
  },
  ky: {
    title: "Checkout",
    subtitle: "Confirm your contact details and delivery information.",
    contact: "Contact details",
    delivery: "Delivery details",
    address: "Delivery address",
    comment: "Comment",
    summary: "Order summary",
    empty: "Your cart is empty. Add products before checkout.",
    submit: "Place order",
    successTitle: "Order placed",
    successDesc: "We will contact you to confirm the details.",
  },
};

const inputClass =
  "h-10 sm:h-11 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground";

const Checkout = () => {
  const { tr, price, lang } = useI18n();
  const { user } = useAuth();
  const { items, totalPrice, clearCart, isLoading } = useCart();
  const navigate = useNavigate();
  const t = copy[lang] || copy.en;
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFullName((current) => current || user?.fullName || "");
    setPhone((current) => current || user?.phone || "");
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const cleared = await clearCart();
    setIsSubmitting(false);

    if (!cleared) {
      return;
    }

    toast({
      title: t.successTitle,
      description: t.successDesc,
    });
    navigate("/shop", { replace: true });
  };

  if (items.length === 0) {
    return (
      <div className="page-shell page-section">
        <div className="surface-card p-8 text-center sm:p-10">
          <h1 className="section-title">{t.title}</h1>
          <p className="section-subtitle">{t.empty}</p>
          <Button asChild className="mt-6">
            <Link to="/shop">{tr("cart.continue")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-section">
      <div className="mb-6">
        <h1 className="section-title">{t.title}</h1>
        <p className="section-subtitle">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form className="surface-card p-5 sm:p-6" onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold">{t.contact}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>{tr("profile.field.fullName")}</span>
              <input
                className={inputClass}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>{tr("profile.field.phone")}</span>
              <input
                className={inputClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                type="tel"
              />
            </label>
          </div>

          <h2 className="mt-6 text-lg font-semibold">{t.delivery}</h2>
          <div className="mt-4 space-y-4">
            <label className="space-y-2 text-sm font-medium">
              <span>{t.address}</span>
              <input
                className={inputClass}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
            </label>
              <label className="space-y-2 text-sm font-medium">
                <span>{t.comment}</span>
                <textarea
                  className="min-h-28 w-full min-w-0 box-border rounded-lg border-0 bg-secondary px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? tr("auth.submit.wait") : t.submit}
            </Button>
            <Button asChild variant="secondary">
              <Link to="/cart">{tr("common.previous")}</Link>
            </Button>
          </div>
        </form>

        <aside className="surface-card h-fit p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{t.summary}</h2>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.quantity} x {price(item.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{price(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{tr("cart.total")}</p>
            <p className="text-2xl font-semibold">{price(totalPrice)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
