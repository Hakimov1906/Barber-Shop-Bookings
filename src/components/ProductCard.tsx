import { motion } from "framer-motion";
import type { Product } from "@/data/products";
import { useI18n } from "@/lib/i18n";
import AddToCartButton from "@/components/AddToCartButton";

const ProductCard = ({ product, onProductClick }: { product: Product; onProductClick?: (product: Product) => void }) => {
  const { tr, tv, price } = useI18n();

  const handleCardClick = () => {
    onProductClick?.(product);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onClick={handleCardClick}
      className="group surface-card overflow-hidden card-shadow transition-shadow duration-200 hover:card-shadow-hover cursor-pointer"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-xs text-muted-foreground">{tv("productType", product.type)}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight sm:min-h-[2.5rem]">{product.name}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="tabular text-sm font-semibold">{price(product.price)}</span>
          <div onClick={(e) => e.stopPropagation()}>
            <AddToCartButton
              product={product}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-100 transition-all duration-200 hover:bg-primary/90 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
