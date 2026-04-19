import { X } from "lucide-react";
import type { Product } from "@/data/products";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

const ProductModal = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const { tv, price } = useI18n();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <div className="flex justify-end p-4 border-b border-border">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product content */}
        <div className="p-6 space-y-4">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Type */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {tv("productType", product.type)}
          </p>

          {/* Name */}
          <h2 className="text-xl font-semibold text-foreground">{product.name}</h2>

          {/* Price */}
          <p className="text-lg font-bold text-primary">{price(product.price)}</p>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Buttons */}
        <div className="border-t border-border p-6 space-y-3">
          <button
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            В корзину
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/75"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
