import { toast } from "@/components/ui/sonner";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/data/products";

type AddToCartButtonProps = {
  product: Product;
  className?: string;
};

const AddToCartButton = ({ product, className = "" }: AddToCartButtonProps) => {
  const { addToCart } = useCart();
  const { tr } = useI18n();

  const handleClick = async () => {
    const success = await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    if (!success) {
      return;
    }

    if (toast && typeof toast.success === "function") {
      toast.success(tr("cart.added", { item: product.name }));
      return;
    }

    if (typeof toast === "function") {
      toast(tr("cart.added", { item: product.name }));
      return;
    }

    console.log(tr("cart.added", { item: product.name }));
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={className}
      aria-label={`${tr("products.addtocart")} ${product.name}`}
    >
      {tr("products.addtocart")}
    </button>
  );
};

export default AddToCartButton;
